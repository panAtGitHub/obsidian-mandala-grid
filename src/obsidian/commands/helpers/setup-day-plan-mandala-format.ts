import { Notice, TFile } from 'obsidian';
import MandalaGrid from 'src/main';
import { getActiveFile } from 'src/obsidian/commands/helpers/get-active-file';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { MANDALA_VIEW_TYPE } from 'src/view/view';
import { setViewType } from 'src/mandala-settings/state/actions/set-view-type';
import {
    analyzeMandalaContent,
    convertToMandalaMarkdown,
    MandalaConversionMode,
} from 'src/mandala-display/logic/mandala-conversion';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { resolveEffectiveMandalaSettings } from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import { MANDALA_FRONTMATTER_SETTINGS_KEY } from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import {
    allSlotsFilled,
    buildCenterDateHeading,
    dateFromDayOfYear,
    dayOfYearFromDate,
    daysInYear,
    DAY_PLAN_DEFAULT_SLOT_TITLES,
    DAY_PLAN_FRONTMATTER_KEY,
    getDayPlanDateHeadingSettings,
    normalizeSlotTitle,
    parseDayPlanFrontmatter,
    slotsRecordToArray,
    upsertSlotHeading,
} from 'src/mandala-display/logic/day-plan';
import {
    ensureSectionChildren,
    getSectionContent,
    replaceSectionContent,
} from 'src/mandala-display/logic/day-plan-sections';
import { openMandalaTemplateSelectModal } from 'src/obsidian/modals/mandala-templates-modal';
import { parseMandalaTemplates } from 'src/mandala-display/logic/mandala-templates';
import {
    DayPlanDisplayOptions,
    openDayPlanConfirmModal,
    openDayPlanDailyOnlyModal,
    openDayPlanDisplayOptionsModal,
    openDayPlanSlotsInputModal,
    openDayPlanYearInputModal,
} from 'src/obsidian/modals/day-plan-setup-modal';
import { logger } from 'src/shared/helpers/logger';
import { applyDayPlanSlotTitles } from 'src/obsidian/commands/helpers/apply-day-plan-slot-titles';

const MANDALA_KEY = 'mandala';
let isSettingUpDayPlan = false;

const getTodayInfo = () => {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
    };
};

const getTodayIsoDate = () => {
    const today = getTodayInfo();
    const month = String(today.month).padStart(2, '0');
    const day = String(today.day).padStart(2, '0');
    return `${today.year}-${month}-${day}`;
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

type ChooseSlotsResult =
    | { action: 'next'; slots: string[] }
    | { action: 'back' }
    | { action: 'cancel' };

const chooseSlots = async (
    plugin: MandalaGrid,
    initialSlots: string[],
): Promise<ChooseSlotsResult> => {
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
                return {
                    action: 'next',
                    slots: selected.slots.map((slot) => normalizeSlotTitle(slot)),
                };
            }
            return { action: 'cancel' };
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
        return {
            action: 'next',
            slots: [...DAY_PLAN_DEFAULT_SLOT_TITLES],
        };
    }

    const manual = await openDayPlanSlotsInputModal(plugin, initialSlots, {
        primaryText: '完成',
    });
    if (manual.action === 'back') return { action: 'back' };
    if (manual.action === 'cancel') return { action: 'cancel' };
    if (!allSlotsFilled(manual.value)) {
        new Notice('请填写完整的 8 个格子标题。');
        return { action: 'cancel' };
    }

    return {
        action: 'next',
        slots: manual.value.map((slot) => normalizeSlotTitle(slot)),
    };
};

const getPlanDayFromToday = (planYear: number) => {
    const today = getTodayInfo();
    const normalized = new Date(Date.UTC(planYear, today.month - 1, today.day));
    const month = normalized.getUTCMonth() + 1;
    const day = normalized.getUTCDate();
    return dayOfYearFromDate(planYear, month, day);
};

const persistDayPlanDisplayOptions = async (
    plugin: MandalaGrid,
    file: TFile,
    options: {
        weekStart: 'monday' | 'sunday';
        dateHeadingFormat:
            | 'date-only'
            | 'zh-full'
            | 'zh-short'
            | 'en-short'
            | 'custom';
        dateHeadingCustomTemplate: string;
    },
) => {
    await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
        const record = frontmatter as Record<string, unknown>;
        const rawSettings = record[MANDALA_FRONTMATTER_SETTINGS_KEY];
        const rootSettings =
            rawSettings && typeof rawSettings === 'object'
                ? (rawSettings as Record<string, unknown>)
                : {};
        const rawGeneral = rootSettings.general;
        const general =
            rawGeneral && typeof rawGeneral === 'object'
                ? (rawGeneral as Record<string, unknown>)
                : {};
        general.weekStart = options.weekStart;
        general.dayPlanDateHeadingFormat = options.dateHeadingFormat;
        general.dayPlanDateHeadingCustomTemplate =
            options.dateHeadingCustomTemplate;
        rootSettings.general = general;
        record[MANDALA_FRONTMATTER_SETTINGS_KEY] = rootSettings;
    });
};

const createYearPlanBodyAsync = async (
    planYear: number,
    todaySection: number,
    slots: string[],
    dateHeadingSettings: ReturnType<typeof getDayPlanDateHeadingSettings>,
    onProgress: (done: number, total: number) => void,
) => {
    const totalDays = daysInYear(planYear);
    const lines: string[] = [];
    for (let day = 1; day <= totalDays; day += 1) {
        lines.push(`<!--section: ${day}-->`);
        lines.push(
            buildCenterDateHeading(
                dateFromDayOfYear(planYear, day),
                dateHeadingSettings,
            ),
        );
        if (day === todaySection) {
            for (let i = 1; i <= 8; i += 1) {
                lines.push(`<!--section: ${todaySection}.${i}-->`);
                lines.push(upsertSlotHeading('', slots[i - 1] ?? ''));
            }
        }
        if (day % 24 === 0 || day === totalDays) {
            onProgress(day, totalDays);
            await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
        }
    }
    return lines.join('\n') + '\n';
};

const mergeBodyWithFrontmatter = (frontmatter: string, body: string) =>
    frontmatter ? `${frontmatter}${body}` : body;

const stripFrontmatterMarkers = (frontmatter: string) =>
    frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, '');

const getTopLevelKey = (line: string) => {
    if (/^\s/.test(line)) return null;
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:/);
    return match ? match[1] : null;
};

const quoteYamlString = (value: string) =>
    `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const buildDayPlanFrontmatter = (
    baseFrontmatter: string,
    dayPlan: {
        year: number;
        dailyOnly3x3: boolean;
        centerDateH2: string;
        slots: string[];
    },
) => {
    const raw = stripFrontmatterMarkers(baseFrontmatter).trim();
    const lines = raw.length > 0 ? raw.split('\n') : [];
    const kept: string[] = [];
    let skippingPlan = false;

    for (const line of lines) {
        const topKey = getTopLevelKey(line);
        if (topKey === DAY_PLAN_FRONTMATTER_KEY) {
            skippingPlan = true;
            continue;
        }
        if (topKey === MANDALA_KEY) {
            skippingPlan = false;
            continue;
        }
        if (skippingPlan && topKey) {
            skippingPlan = false;
        }
        if (skippingPlan) continue;
        kept.push(line);
    }

    while (kept.length > 0 && kept[kept.length - 1].trim() === '') {
        kept.pop();
    }

    const slotLines = dayPlan.slots.map(
        (value, index) =>
            `    "${index + 1}": ${quoteYamlString(normalizeSlotTitle(value))}`,
    );

    const nextLines = [
        ...kept,
        `${MANDALA_KEY}: true`,
        `${DAY_PLAN_FRONTMATTER_KEY}:`,
        '  enabled: true',
        `  year: ${dayPlan.year}`,
        `  daily_only_3x3: ${dayPlan.dailyOnly3x3 ? 'true' : 'false'}`,
        `  center_date_h2: ${quoteYamlString(dayPlan.centerDateH2)}`,
        '  slots:',
        ...slotLines,
    ];

    return `---\n${nextLines.join('\n')}\n---\n`;
};

const applyTodaySlotsForYear = (body: string, planYear: number) => {
    const day = getPlanDayFromToday(planYear);
    let nextBody = ensureSectionChildren(body, String(day), 8);

    const hasAnySlotContent = Array.from({ length: 8 }, (_, index) => {
        const section = `${day}.${index + 1}`;
        const content = getSectionContent(nextBody, section) ?? '';
        return content.trim().length > 0;
    }).some(Boolean);

    return { body: nextBody, day, hasAnySlotContent };
};

const refreshMandalaViewData = (
    plugin: MandalaGrid,
    file: TFile,
    content: string,
) => {
    window.setTimeout(() => {
        const leaf = getLeafOfFile(plugin, file, MANDALA_VIEW_TYPE);
        if (!leaf) return;
        const maybeTextView = leaf.view as unknown as {
            setViewData?: (data: string) => void;
        };
        if (typeof maybeTextView.setViewData === 'function') {
            maybeTextView.setViewData(content);
        }
    }, 50);
};

const ensureMandalaView = async (plugin: MandalaGrid, file: TFile) => {
    let leaf = getLeafOfFile(plugin, file, MANDALA_VIEW_TYPE);
    if (leaf) return leaf;

    leaf = getLeafOfFile(plugin, file, 'markdown');
    if (!leaf) {
        leaf = await openFile(plugin, file, 'tab');
    }

    toggleObsidianViewType(plugin, leaf, MANDALA_VIEW_TYPE);
    setViewType(plugin, file.path, MANDALA_VIEW_TYPE);
    return leaf;
};

export const setupDayPlanMandalaFormat = async (
    plugin: MandalaGrid,
    targetFile?: TFile,
) => {
    if (isSettingUpDayPlan) {
        new Notice('正在生成年计划数据，请先不要使用。');
        return false;
    }
    isSettingUpDayPlan = true;
    const processingNotice = new Notice(
        '正在生成年计划数据，请先不要使用。',
        0,
    );
    try {
        const startMs = performance.now();
        const file = targetFile ?? getActiveFile(plugin);
        if (!file) {
            new Notice('未找到当前文件。');
            return false;
        }

        if (file.extension !== 'md') {
            new Notice('仅支持 Markdown 文件。');
            return false;
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
        const existingPlan = parseDayPlanFrontmatter(frontmatter);
        const effectiveSettings = resolveEffectiveMandalaSettings(
            plugin.settings.getValue(),
            frontmatter,
        );

        const existingYear = Number(existingPlan?.year);
        const planSlotsFromYaml = slotsRecordToArray(existingPlan?.slots);
        const initialDisplayOptions: DayPlanDisplayOptions = {
            weekStart: effectiveSettings.general.weekStart,
            dateHeadingFormat: effectiveSettings.general.dayPlanDateHeadingFormat,
        };
        const resolveInitialSlots = (selectedYear: number) => {
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
            return allSlotsFilled(planSlotsFromYaml)
                ? planSlotsFromYaml
                : allSlotsFilled(sectionSlots)
                  ? sectionSlots
                  : Array.from({ length: 8 }, () => '');
        };

        let wizardStep: 'year' | 'display' | 'daily' | 'slots' = 'year';
        let selectedYear = getTodayInfo().year;
        let displayOptions = initialDisplayOptions;
        let dailyOnly3x3 = existingPlan?.daily_only_3x3 ?? true;
        let slots: string[] | null = null;

        while (!slots) {
            if (wizardStep === 'year') {
                const result = await openDayPlanYearInputModal(
                    plugin,
                    selectedYear,
                );
                if (result.action === 'cancel') return false;
                if (result.action === 'back') continue;
                selectedYear = result.value;
                if (
                    existingPlan?.enabled === true &&
                    Number.isInteger(existingYear) &&
                    existingYear !== selectedYear
                ) {
                    new Notice('请另存新文件作为新的年计划。');
                    continue;
                }
                wizardStep = 'display';
                continue;
            }

            if (wizardStep === 'display') {
                const result = await openDayPlanDisplayOptionsModal(plugin, {
                    weekStart: displayOptions.weekStart,
                    dateHeadingFormat: displayOptions.dateHeadingFormat,
                });
                if (result.action === 'cancel') return false;
                if (result.action === 'back') {
                    wizardStep = 'year';
                    continue;
                }
                displayOptions = result.value;
                wizardStep = 'daily';
                continue;
            }

            if (wizardStep === 'daily') {
                const result = await openDayPlanDailyOnlyModal(
                    plugin,
                    dailyOnly3x3,
                );
                if (result.action === 'cancel') return false;
                if (result.action === 'back') {
                    wizardStep = 'display';
                    continue;
                }
                dailyOnly3x3 = result.value;
                wizardStep = 'slots';
                continue;
            }

            const slotResult = await chooseSlots(
                plugin,
                resolveInitialSlots(selectedYear),
            );
            if (slotResult.action === 'cancel') return false;
            if (slotResult.action === 'back') {
                wizardStep = 'daily';
                continue;
            }
            slots = slotResult.slots;
        }

        const todaySection = String(getPlanDayFromToday(selectedYear));
        const dateHeadingSettings = getDayPlanDateHeadingSettings({
            format: displayOptions.dateHeadingFormat,
            customTemplate:
                effectiveSettings.general.dayPlanDateHeadingCustomTemplate,
            applyMode: effectiveSettings.general.dayPlanDateHeadingApplyMode,
        });

        let nextBody = body;
        let firstRun = !(existingPlan?.enabled === true);

        if (firstRun) {
            const generationStartMs = performance.now();
            nextBody = await createYearPlanBodyAsync(
                selectedYear,
                Number(todaySection),
                slots,
                dateHeadingSettings,
                (done, total) => {
                    new Notice(`正在生成：${done}/${total}`, 800);
                },
            );
            logger.debug('[perf][day-plan-setup] generate-year-body', {
                file: file.path,
                year: selectedYear,
                costMs: Number(
                    (performance.now() - generationStartMs).toFixed(2),
                ),
            });
            nextBody = applyDayPlanSlotTitles(
                nextBody,
                ['1', todaySection],
                slots,
            );
        } else {
            const todayApplied = applyTodaySlotsForYear(nextBody, selectedYear);
            nextBody = todayApplied.body;

            if (todayApplied.hasAnySlotContent) {
                const shouldOverwriteAll = await openDayPlanConfirmModal(
                    plugin,
                    {
                        title: '是否一次性覆盖 8 个格子的标题？',
                        message: '确认后将统一覆盖当天 section 的 8 个标题行。',
                        confirmText: '一次性覆盖',
                        cancelText: '取消',
                    },
                );
                if (!shouldOverwriteAll) return false;
            }

            for (let i = 0; i < 8; i += 1) {
                const section = `${todayApplied.day}.${i + 1}`;
                const currentContent =
                    getSectionContent(nextBody, section) ?? '';
                nextBody = replaceSectionContent(
                    nextBody,
                    section,
                    upsertSlotHeading(currentContent, slots[i]),
                );
            }
        }

        const nextFrontmatter = buildDayPlanFrontmatter(frontmatter, {
            year: selectedYear,
            dailyOnly3x3,
            centerDateH2: buildCenterDateHeading(
                getTodayIsoDate(),
                dateHeadingSettings,
            ),
            slots,
        });
        const nextContent = mergeBodyWithFrontmatter(nextFrontmatter, nextBody);
        const writeStartMs = performance.now();
        await plugin.app.vault.modify(file, nextContent);
        await persistDayPlanDisplayOptions(plugin, file, {
            weekStart: displayOptions.weekStart,
            dateHeadingFormat: displayOptions.dateHeadingFormat,
            dateHeadingCustomTemplate:
                effectiveSettings.general.dayPlanDateHeadingCustomTemplate,
        });
        logger.debug('[perf][day-plan-setup] write-markdown', {
            file: file.path,
            costMs: Number((performance.now() - writeStartMs).toFixed(2)),
        });

        await ensureMandalaView(plugin, file);
        const latestAfterFrontmatter = await plugin.app.vault.read(file);
        refreshMandalaViewData(plugin, file, latestAfterFrontmatter);
        logger.debug('[perf][day-plan-setup] total', {
            file: file.path,
            firstRun,
            year: selectedYear,
            costMs: Number((performance.now() - startMs).toFixed(2)),
        });

        new Notice('已设置为年计划日计划格式。');
        return true;
    } finally {
        processingNotice.hide();
        isSettingUpDayPlan = false;
    }
};
