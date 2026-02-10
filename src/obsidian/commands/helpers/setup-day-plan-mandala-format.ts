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
    DAY_PLAN_DEFAULT_SLOT_TITLES,
    DAY_PLAN_FRONTMATTER_KEY,
    extractDateFromCenterHeading,
    hasValidCenterDateHeading,
    isIsoDate,
    normalizeSlotTitle,
    slotsRecordToArray,
    toSlotsRecord,
    upsertCenterDateHeading,
    upsertSlotHeading,
} from 'src/lib/mandala/day-plan';
import {
    ensureSectionChildren,
    getSectionContent,
    replaceSectionContent,
} from 'src/lib/mandala/day-plan-sections';
import {
    openMandalaTemplateSelectModal,
} from 'src/obsidian/modals/mandala-templates-modal';
import { parseMandalaTemplates } from 'src/lib/mandala/mandala-templates';
import {
    openDayPlanConfirmModal,
    openDayPlanDateInputModal,
    openDayPlanSlotsInputModal,
} from 'src/obsidian/modals/day-plan-setup-modal';

const MANDALA_KEY = 'mandala';

const getTodayIsoDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

const mergeBodyWithFrontmatter = (frontmatter: string, body: string) =>
    frontmatter ? `${frontmatter}${body}` : body;

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

    let workingBody = ensureSectionChildren(body, '1', 8);

    const centerSection = getSectionContent(workingBody, '1') ?? '';
    let centerDate: string | null = null;
    if (hasValidCenterDateHeading(centerSection)) {
        const lines = centerSection.split('\n');
        const firstLine = lines.find((line) => line.trim().length > 0) ?? '';
        centerDate = extractDateFromCenterHeading(firstLine);
    }

    if (centerDate) {
        const shouldResetDate = await openDayPlanConfirmModal(plugin, {
            title: '是否重设中心日期？',
            message: `当前日期为 ${centerDate}。若重设，将更新 section 1 标题。`,
            confirmText: '重设日期',
            cancelText: '保持不变',
        });
        if (shouldResetDate) {
            const input = await openDayPlanDateInputModal(plugin, centerDate);
            if (!input) return;
            if (!isIsoDate(input)) {
                new Notice('日期格式错误，请输入 yyyy-mm-dd。');
                return;
            }
            centerDate = input;
        }
    }

    if (!centerDate) {
        const input = await openDayPlanDateInputModal(plugin, getTodayIsoDate());
        if (!input) return;
        if (!isIsoDate(input)) {
            new Notice('日期格式错误，请输入 yyyy-mm-dd。');
            return;
        }
        centerDate = input;
    }

    const existingPlan = parseDayPlanFromFrontmatter(frontmatter);
    const planSlotsFromYaml = slotsRecordToArray(
        existingPlan?.slots as Record<string, unknown> | null | undefined,
    );

    const sectionSlots = Array.from({ length: 8 }, (_, index) => {
        const section = `1.${index + 1}`;
        const sectionContent = getSectionContent(workingBody, section) ?? '';
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

    const centerHeading = buildCenterDateHeading(centerDate);
    workingBody = replaceSectionContent(
        workingBody,
        '1',
        upsertCenterDateHeading(centerSection, centerDate),
    );

    for (let i = 0; i < 8; i += 1) {
        const section = `1.${i + 1}`;
        const currentContent = getSectionContent(workingBody, section) ?? '';

        let shouldApply = true;
        if (currentContent.trim().length > 0) {
            shouldApply = await openDayPlanConfirmModal(plugin, {
                title: `是否更新 ${section} 标题？`,
                message: `将把 ${section} 首行更新为：\n${`### ${slots[i]}`}`,
                confirmText: '覆盖标题',
                cancelText: '跳过',
            });
        }

        if (!shouldApply) continue;

        workingBody = replaceSectionContent(
            workingBody,
            section,
            upsertSlotHeading(currentContent, slots[i]),
        );
    }

    const nextContent = mergeBodyWithFrontmatter(frontmatter, workingBody);
    await plugin.app.vault.modify(file, nextContent);

    await plugin.app.fileManager.processFrontMatter(file, (fm) => {
        const record = fm as Record<string, unknown>;
        record[MANDALA_KEY] = true;
        record[DAY_PLAN_FRONTMATTER_KEY] = {
            enabled: true,
            version: 1,
            center_date_h2: centerHeading,
            slots: toSlotsRecord(slots),
        };
    });

    new Notice('已设置为日计划九宫格格式。可在 YAML 区继续修改。');
};
