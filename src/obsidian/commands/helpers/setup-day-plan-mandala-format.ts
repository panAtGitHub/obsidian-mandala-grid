import { Notice, TFile, parseYaml } from 'obsidian';
import MandalaGrid from 'src/main';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import {
    analyzeMandalaContent,
    convertToMandalaMarkdown,
    MandalaConversionMode,
} from 'src/lib/mandala/mandala-conversion';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import {
    allSlotsFilled,
    buildCenterDateHeading,
    dateFromDayOfYear,
    dayOfYearFromDate,
    daysInYear,
    DAY_PLAN_DEFAULT_SLOT_TITLES,
    DAY_PLAN_FRONTMATTER_KEY,
    normalizeSlotTitle,
    slotsRecordToArray,
    toSlotsRecord,
    upsertSlotHeading,
} from 'src/lib/mandala/day-plan';
import {
    ensureSectionChildren,
    getSectionContent,
    replaceSectionContent,
} from 'src/lib/mandala/day-plan-sections';
import { openMandalaTemplateSelectModal } from 'src/obsidian/modals/mandala-templates-modal';
import { parseMandalaTemplates } from 'src/lib/mandala/mandala-templates';
import {
    openDayPlanConfirmModal,
    openDayPlanSlotsInputModal,
    openDayPlanYearInputModal,
} from 'src/obsidian/modals/day-plan-setup-modal';

const MANDALA_KEY = 'mandala';

const getTodayInfo = () => {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
    };
};

const getConversionMode = (
    analysis: ReturnType<typeof analyzeMandalaContent>,
): MandalaConversionMode | null => {
    if (analysis.hasSection1 && !analysis.hasSection1_1) {
        return 'normalize-core';
    }
    if (!analysis.hasMandalaFrontmatter && !analysis.hasSections) {
        return 'template-with-content';
    }
    if (!analysis.hasMandalaFrontmatter) {
        return 'normalize-core';
    }
    return null;
};

const readTemplatesFromSettings = async (plugin: MandalaGrid) => {
    const path = plugin.settings.getValue().general.mandalaTemplatesFilePath;
    if (!path) return [];
    const abstract = plugin.app.vault.getAbstractFileByPath(path);
    if (!(abstract instanceof TFile)) return [];

    try {
        const raw = await plugin.app.vault.read(abstract);
        return parseMandalaTemplates(raw);
    } catch {
        return [];
    }
};

const parseDayPlanFromFrontmatter = (frontmatter: string) => {
    if (!frontmatter.trim()) return null;
    const stripped = frontmatter
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '')
        .trim();
    if (!stripped) return null;

    try {
        const parsed: unknown = parseYaml(stripped);
        if (!parsed || typeof parsed !== 'object') return null;
        const record = parsed as Record<string, unknown>;
        const plan = record[DAY_PLAN_FRONTMATTER_KEY];
        if (!plan || typeof plan !== 'object') return null;
        return plan as Record<string, unknown>;
    } catch {
        return null;
    }
};

const chooseSlots = async (
    plugin: MandalaGrid,
    initialSlots: string[],
): Promise<string[] | null> => {
    const templates = await readTemplatesFromSettings(plugin);
    if (templates.length > 0) {
        const useTemplate = await openDayPlanConfirmModal(plugin, {
            title: '使用模板配置 8 个格子？',
            message: '检测到已配置的九宫格模板文件，是否从模板中选择一组？',
            confirmText: '选择模板',
            cancelText: '不用模板',
        });

        if (useTemplate) {
            const selected = await openMandalaTemplateSelectModal(
                plugin,
                templates,
            );
            if (selected) {
                return selected.slots.map((slot) => normalizeSlotTitle(slot));
            }
        }
    }

    const recommendedTemplatePreview = DAY_PLAN_DEFAULT_SLOT_TITLES.map(
        (slot, index) => `${index + 1}. ${slot}`,
    ).join('\n');

    const useRecommended = await openDayPlanConfirmModal(plugin, {
        title: '是否采用本插件推荐的日计划模板？',
        message:
            '推荐模板如下：\n' +
            recommendedTemplatePreview +
            '\n\n若不采用推荐模板，将进入 8 行手动输入。',
        confirmText: '使用推荐模板',
        cancelText: '手动输入',
    });

    if (useRecommended) {
        return [...DAY_PLAN_DEFAULT_SLOT_TITLES];
    }

    const manual = await openDayPlanSlotsInputModal(plugin, initialSlots);
    if (!manual) return null;
    if (!allSlotsFilled(manual)) {
        new Notice('请填写完整的 8 个格子标题。');
        return null;
    }

    return manual.map((slot) => normalizeSlotTitle(slot));
};

const getPlanDayFromToday = (planYear: number) => {
    const today = getTodayInfo();
    const normalized = new Date(
        Date.UTC(planYear, today.month - 1, today.day),
    );
    const month = normalized.getUTCMonth() + 1;
    const day = normalized.getUTCDate();
    return dayOfYearFromDate(planYear, month, day);
};

const createYearPlanBody = (
    planYear: number,
    todaySection: number,
    slots: string[],
) => {
    const totalDays = daysInYear(planYear);
    const lines: string[] = [];

    for (let day = 1; day <= totalDays; day += 1) {
        lines.push(`<!--section: ${day}-->`);
        lines.push(buildCenterDateHeading(dateFromDayOfYear(planYear, day)));

        for (let i = 1; i <= 8; i += 1) {
            lines.push(`<!--section: ${day}.${i}-->`);
            if (day === todaySection) {
                lines.push(upsertSlotHeading('', slots[i - 1] ?? ''));
            } else {
                lines.push('');
            }
        }
    }

    return lines.join('\n') + '\n';
};

const mergeBodyWithFrontmatter = (frontmatter: string, body: string) =>
    frontmatter ? `${frontmatter}${body}` : body;

const applyTodaySlotsForYear = (
    body: string,
    planYear: number,
) => {
    const day = getPlanDayFromToday(planYear);
    let nextBody = ensureSectionChildren(body, String(day), 8);

    const hasAnySlotContent = Array.from({ length: 8 }, (_, index) => {
        const section = `${day}.${index + 1}`;
        const content = getSectionContent(nextBody, section) ?? '';
        return content.trim().length > 0;
    }).some(Boolean);

    return { body: nextBody, day, hasAnySlotContent };
};

export const setupDayPlanMandalaFormat = async (plugin: MandalaGrid) => {
    const file = getActiveFile(plugin);
    if (!file) {
        new Notice('未找到当前文件。');
        return;
    }

    if (file.extension !== 'md') {
        new Notice('仅支持 Markdown 文件。');
        return;
    }

    let content = await plugin.app.vault.read(file);
    const analysis = analyzeMandalaContent(content);
    const conversionMode = getConversionMode(analysis);
    if (conversionMode) {
        content = convertToMandalaMarkdown(content, conversionMode);
        await plugin.app.vault.modify(file, content);
    }

    const latest = await plugin.app.vault.read(file);
    const { body, frontmatter } = extractFrontmatter(latest);
    const existingPlan = parseDayPlanFromFrontmatter(frontmatter);

    const selectedYear = await openDayPlanYearInputModal(
        plugin,
        getTodayInfo().year,
    );
    if (!selectedYear) return;

    const existingYear = Number(existingPlan?.year);
    if (
        existingPlan?.enabled === true &&
        Number.isInteger(existingYear) &&
        existingYear !== selectedYear
    ) {
        new Notice('请另存新文件作为新的年计划。');
        return;
    }

    const planSlotsFromYaml = slotsRecordToArray(
        existingPlan?.slots as Record<string, unknown> | null | undefined,
    );

    const todaySection = String(getPlanDayFromToday(selectedYear));
    const sectionSlots = Array.from({ length: 8 }, (_, index) => {
        const section = `${todaySection}.${index + 1}`;
        const sectionContent = getSectionContent(body, section) ?? '';
        const firstLine =
            sectionContent
                .split('\n')
                .find((line) => line.trim().length > 0) ?? '';
        return normalizeSlotTitle(firstLine);
    });

    const initialSlots = allSlotsFilled(planSlotsFromYaml)
        ? planSlotsFromYaml
        : allSlotsFilled(sectionSlots)
          ? sectionSlots
          : Array.from({ length: 8 }, () => '');

    const slots = await chooseSlots(plugin, initialSlots);
    if (!slots) return;

    let nextBody = body;
    let firstRun = !(existingPlan?.enabled === true);

    if (firstRun) {
        nextBody = createYearPlanBody(selectedYear, Number(todaySection), slots);
    } else {
        const todayApplied = applyTodaySlotsForYear(nextBody, selectedYear);
        nextBody = todayApplied.body;

        if (todayApplied.hasAnySlotContent) {
            const shouldOverwriteAll = await openDayPlanConfirmModal(plugin, {
                title: '是否一次性覆盖 8 个格子的标题？',
                message: '确认后将统一覆盖当天 section 的 8 个标题行。',
                confirmText: '一次性覆盖',
                cancelText: '取消',
            });
            if (!shouldOverwriteAll) return;
        }

        for (let i = 0; i < 8; i += 1) {
            const section = `${todayApplied.day}.${i + 1}`;
            const currentContent = getSectionContent(nextBody, section) ?? '';
            nextBody = replaceSectionContent(
                nextBody,
                section,
                upsertSlotHeading(currentContent, slots[i]),
            );
        }
    }

    const nextContent = mergeBodyWithFrontmatter(frontmatter, nextBody);
    await plugin.app.vault.modify(file, nextContent);

    await plugin.app.fileManager.processFrontMatter(file, (fm) => {
        const record = fm as Record<string, unknown>;
        record[MANDALA_KEY] = true;
        record[DAY_PLAN_FRONTMATTER_KEY] = {
            enabled: true,
            year: selectedYear,
            center_date_h2: buildCenterDateHeading(
                dateFromDayOfYear(selectedYear, 1),
            ),
            slots: toSlotsRecord(slots),
        };
    });

    new Notice('已设置为年计划日计划格式。');
};
