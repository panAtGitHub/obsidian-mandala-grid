import { parseSectionMarker } from 'src/mandala-document/engine/parse-section-marker';
import { Notice, TFile, parseYaml, stringifyYaml } from 'obsidian';
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
import {
    withDayPlanDisplaySettings,
    resolveEffectiveMandalaSettings,
} from 'src/mandala-settings/state/frontmatter/mandala-frontmatter-settings';
import {
    allSlotsFilled,
    buildCenterDateHeading,
    dateFromDayOfYear,
    dayOfYearFromDate,
    daysInYear,
    DAY_PLAN_DEFAULT_SLOT_TITLES,
    readDayPlanConfiguration,
    writeDayPlanConfiguration,
    isValidDayPlanDateTemplate,
    extractDateFromCenterHeading,
    getDayPlanDateHeadingSettings,
    normalizeSlotTitle,
    slotsRecordToArray,
    upsertSlotHeading,
} from 'src/mandala-display/logic/day-plan';
import { getSectionContent } from 'src/mandala-display/logic/day-plan-sections';
import { parseMandalaTemplates } from 'src/mandala-display/logic/mandala-templates';
import {
    DayPlanDailySetupValue,
    DayPlanDisplayOptions,
    openDayPlanDailySetupModal,
    openDayPlanDisplayOptionsModal,
    openDayPlanSlotsInputModal,
    openDayPlanYearInputModal,
} from 'src/obsidian/modals/day-plan-setup-modal';
import { logger } from 'src/shared/helpers/logger';
import { applyDayPlanSlotTitles } from 'src/obsidian/commands/helpers/apply-day-plan-slot-titles';

let isSettingUpDayPlan = false;

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

const resolveSlotsFromDailySetup = (
    setup: DayPlanDailySetupValue,
    templates: Awaited<ReturnType<typeof readTemplatesFromSettings>>,
) => {
    if (setup.slotsSource === 'recommended') {
        return [...DAY_PLAN_DEFAULT_SLOT_TITLES];
    }
    if (setup.slotsSource === 'template') {
        const template =
            templates[
                setup.templateIndex === null ? -1 : setup.templateIndex
            ] ?? null;
        return template
            ? template.slots.map((slot) => normalizeSlotTitle(slot))
            : [...DAY_PLAN_DEFAULT_SLOT_TITLES];
    }
    return null;
};

const getPlanDayFromToday = (planYear: number) => {
    const today = getTodayInfo();
    const normalized = new Date(Date.UTC(planYear, today.month - 1, today.day));
    const month = normalized.getUTCMonth() + 1;
    const day = normalized.getUTCDate();
    return dayOfYearFromDate(planYear, month, day);
};

const createYearPlanBodyAsync = async (
    planYear: number,
    todaySection: number,
    slots: string[],
    dateHeadingSettings: ReturnType<typeof getDayPlanDateHeadingSettings>,
    onProgress: (done: number, total: number) => void,
    existingBody: string,
) => {
    const existingSections = new Map<string, string[]>();
    let currentSection = '1';
    for (const line of existingBody.split('\n')) {
        const marker = parseSectionMarker(line);
        if (marker) {
            currentSection = marker[2];
            continue;
        }
        const sectionLines = existingSections.get(currentSection) ?? [];
        sectionLines.push(line);
        existingSections.set(currentSection, sectionLines);
    }
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
        const previousCenter = [...(existingSections.get(String(day)) ?? [])];
        const firstContent = previousCenter.findIndex((line) => !!line.trim());
        if (
            firstContent >= 0 &&
            extractDateFromCenterHeading(previousCenter[firstContent])
        )
            previousCenter.splice(firstContent, 1);
        if (previousCenter.some((line) => !!line.trim()))
            lines.push(...previousCenter);
        existingSections.delete(String(day));
        const children = [...existingSections.keys()].filter((section) =>
            section.startsWith(`${day}.`),
        );
        if (day === todaySection) {
            for (let i = 1; i <= 8; i += 1)
                if (!children.includes(`${day}.${i}`))
                    children.push(`${day}.${i}`);
        }
        for (const section of children) {
            lines.push(`<!--section: ${section}-->`);
            const previous = existingSections.get(section)?.join('\n') ?? '';
            lines.push(
                previous.trim()
                    ? previous
                    : upsertSlotHeading(
                          '',
                          slots[Number(section.split('.')[1]) - 1] ?? '',
                      ),
            );
            existingSections.delete(section);
        }
        if (day % 24 === 0 || day === totalDays) {
            onProgress(day, totalDays);
            await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
        }
    }
    for (const [section, sectionLines] of existingSections) {
        if (sectionLines.some((line) => !!line.trim()))
            lines.push(`<!--section: ${section}-->`, ...sectionLines);
    }
    return lines.join('\n') + '\n';
};

const mergeBodyWithFrontmatter = (frontmatter: string, body: string) =>
    frontmatter ? `${frontmatter}${body}` : body;

const stripFrontmatterMarkers = (frontmatter: string) =>
    frontmatter.replace(/^---\n/, '').replace(/\n---\n?$/, '');

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

        const originalContent = await plugin.app.vault.read(file);
        let content = originalContent;
        const analysis = analyzeMandalaContent(content);
        const conversionMode = getConversionMode(analysis);
        if (conversionMode) {
            content = convertToMandalaMarkdown(content, conversionMode);
        }

        const { body, frontmatter } = extractFrontmatter(content);
        const parsedPlan = readDayPlanConfiguration(frontmatter);
        if (parsedPlan.error) {
            new Notice(parsedPlan.error);
            return false;
        }
        const existingPlan = parsedPlan.config;
        const effectiveSettings = resolveEffectiveMandalaSettings(
            plugin.settings.getValue(),
            frontmatter,
        );

        const existingYear = Number(existingPlan?.year);
        const planSlotsFromYaml = slotsRecordToArray(existingPlan?.slots);
        const initialDisplayOptions: DayPlanDisplayOptions = {
            weekStart: effectiveSettings.general.weekStart,
            dateHeadingFormat:
                effectiveSettings.general.dayPlanDateHeadingFormat,
            dateHeadingCustomTemplate:
                effectiveSettings.general.dayPlanDateHeadingCustomTemplate,
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

        const templates = await readTemplatesFromSettings(plugin);

        let wizardStep: 'year' | 'display' | 'daily' | 'slots' = 'year';
        let selectedYear = existingPlan?.year ?? getTodayInfo().year;
        let displayOptions = initialDisplayOptions;
        let dailySetup: DayPlanDailySetupValue = {
            slotsSource: existingPlan ? 'manual' : 'recommended',
            templateIndex: templates.length > 0 ? 0 : null,
        };
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
                    existingPlan &&
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
                    dateHeadingCustomTemplate:
                        displayOptions.dateHeadingCustomTemplate,
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
                const result = await openDayPlanDailySetupModal(
                    plugin,
                    dailySetup,
                    templates,
                );
                if (result.action === 'cancel') return false;
                if (result.action === 'back') {
                    wizardStep = 'display';
                    continue;
                }
                dailySetup = result.value;
                const resolvedSlots = resolveSlotsFromDailySetup(
                    dailySetup,
                    templates,
                );
                if (resolvedSlots) {
                    slots = resolvedSlots;
                    continue;
                }
                wizardStep = 'slots';
                continue;
            }

            const manual = await openDayPlanSlotsInputModal(
                plugin,
                resolveInitialSlots(selectedYear),
                {
                    primaryText: '完成',
                },
            );
            if (manual.action === 'cancel') return false;
            if (manual.action === 'back') {
                wizardStep = 'daily';
                continue;
            }
            if (!allSlotsFilled(manual.value)) {
                new Notice('请填写完整的 8 个格子标题。');
                return false;
            }
            slots = manual.value.map((slot) => normalizeSlotTitle(slot));
        }

        const todaySection = String(getPlanDayFromToday(selectedYear));
        const dateHeadingSettings = getDayPlanDateHeadingSettings({
            format: displayOptions.dateHeadingFormat,
            customTemplate:
                displayOptions.dateHeadingCustomTemplate ??
                effectiveSettings.general.dayPlanDateHeadingCustomTemplate,
        });

        let nextBody = body;
        const firstRun = !existingPlan;

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
                body,
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
        }
        if (
            dateHeadingSettings.format === 'custom' &&
            !isValidDayPlanDateTemplate(dateHeadingSettings.customTemplate)
        ) {
            new Notice(
                '自定义标题必须以 {date} 或 ## {date} 开头，且只能使用一行。',
            );
            return false;
        }
        const latest = await plugin.app.vault.read(file);
        if (latest !== originalContent) {
            new Notice('文件在设置期间已修改，请重新打开设置。');
            return false;
        }
        const latestFrontmatter = extractFrontmatter(latest).frontmatter;
        const root = parseYaml(
            stripFrontmatterMarkers(latestFrontmatter),
        ) as Record<string, unknown> | null;
        const record = root ?? {};
        record.mandala = true;
        record.mandala_settings = {
            view: {
                ...effectiveSettings.view,
                enableNx9View: effectiveSettings.general.weekPlanEnabled
                    ? true
                    : effectiveSettings.view.enableNx9View,
                enable9x9View: false,
                subgridMaxDepth: 2,
            },
        };
        writeDayPlanConfiguration(
            record,
            withDayPlanDisplaySettings(
                {
                    enabled: true,
                    year: selectedYear,
                    slots: Object.fromEntries(
                        slots.map((title, index) => [String(index + 1), title]),
                    ),
                },
                {
                    ...effectiveSettings.general,
                    weekStart: displayOptions.weekStart,
                    dayPlanDateHeadingFormat: displayOptions.dateHeadingFormat,
                    dayPlanDateHeadingCustomTemplate:
                        dateHeadingSettings.customTemplate,
                },
            ),
        );
        const nextContent = mergeBodyWithFrontmatter(
            `---\n${stringifyYaml(record)}---\n`,
            nextBody,
        );
        const writeStartMs = performance.now();
        let conflict = false;
        await plugin.app.vault.process(file, (raw) => {
            if (raw !== originalContent) {
                conflict = true;
                return raw;
            }
            return nextContent;
        });
        if (conflict) {
            new Notice('文件在设置期间已修改，请重新打开设置。');
            return false;
        }
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
