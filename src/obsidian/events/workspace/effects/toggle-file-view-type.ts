import MandalaGrid from 'src/main';
import { Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { MANDALA_VIEW_TYPE } from 'src/view/view';
import { openMandalaConversionModal } from 'src/obsidian/modals/mandala-conversion-modal';
import {
    analyzeMandalaContent,
    convertToMandalaMarkdown,
    MandalaConversionMode,
} from 'src/lib/mandala/mandala-conversion';
import {
    createDayPlanTitleSyncBatches,
    syncDayPlanTitlesBySections,
    syncDayPlanTitlesInMarkdown,
} from 'src/lib/mandala/sync-day-plan-titles';
import { refreshDayPlanDateHeadingsInMarkdown } from 'src/obsidian/commands/helpers/refresh-day-plan-date-headings';
import {
    buildCenterDateHeading,
    DAY_PLAN_FRONTMATTER_KEY,
    dayOfYearFromDate,
    getDayPlanDateHeadingSettings,
    parseDayPlanFromMarkdown,
} from 'src/lib/mandala/day-plan';
import {
    DayPlanSlotsSyncMode,
    openDayPlanSlotsSyncModeModal,
} from 'src/obsidian/modals/day-plan-setup-modal';

import { setViewType } from 'src/mandala-settings/state/actions/set-view-type';

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

const getTodayIsoDate = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
};

const getDateHeadingSettings = (plugin: MandalaGrid) =>
    getDayPlanDateHeadingSettings({
        format: plugin.settings.getValue().general.dayPlanDateHeadingFormat,
        customTemplate:
            plugin.settings.getValue().general.dayPlanDateHeadingCustomTemplate,
        applyMode:
            plugin.settings.getValue().general.dayPlanDateHeadingApplyMode,
    });

const splitSectionsToBatches = (sections: string[], batchSize: number) => {
    const normalizedBatchSize = Math.max(1, batchSize);
    const batches: string[][] = [];
    for (let i = 0; i < sections.length; i += normalizedBatchSize) {
        batches.push(sections.slice(i, i + normalizedBatchSize));
    }
    return batches;
};

const getCoreFromSlotSection = (section: string) => {
    const coreText = section.split('.')[0];
    const core = Number(coreText);
    if (!Number.isInteger(core)) return null;
    return core;
};

const getPlanDayFromToday = (planYear: number, now: Date = new Date()) => {
    const normalized = new Date(
        Date.UTC(planYear, now.getMonth(), now.getDate()),
    );
    const month = normalized.getUTCMonth() + 1;
    const day = normalized.getUTCDate();
    return dayOfYearFromDate(planYear, month, day);
};

const syncDayPlanTitlesWithBatches = (
    markdown: string,
    batches: string[][],
) => {
    let nextMarkdown = markdown;
    let changed = false;
    for (const sections of batches) {
        const batch = syncDayPlanTitlesBySections(nextMarkdown, sections);
        if (batch.changed) changed = true;
        nextMarkdown = batch.markdown;
    }
    return {
        changed,
        markdown: nextMarkdown,
    };
};

const syncDayPlanTitlesByUserChoice = async (
    plugin: MandalaGrid,
    markdown: string,
) => {
    const fullSyncResult = syncDayPlanTitlesInMarkdown(markdown);
    if (!fullSyncResult.changed) {
        return {
            changed: false,
            markdown,
        };
    }

    const mode: DayPlanSlotsSyncMode | null =
        await openDayPlanSlotsSyncModeModal(plugin);
    if (!mode) {
        return {
            changed: false,
            markdown,
        };
    }

    if (mode === 'template-only') {
        new Notice('已仅更新模板，不修改已存在格子标题。');
        return {
            changed: false,
            markdown,
        };
    }

    if (mode === 'all-existing') {
        new Notice('已根据 YAML 模板替换所有已存在日期的格子标题。');
        return {
            changed: true,
            markdown: fullSyncResult.markdown,
        };
    }

    const plan = parseDayPlanFromMarkdown(markdown);
    const batchPlan = createDayPlanTitleSyncBatches(markdown, 120);
    if (!plan || !batchPlan) {
        new Notice('未检测到可同步的日计划格子标题。');
        return {
            changed: false,
            markdown,
        };
    }

    const todayCore = getPlanDayFromToday(plan.year);
    const targetSections = batchPlan.batches
        .flat()
        .filter((section) => {
            const core = getCoreFromSlotSection(section);
            return core !== null && core >= todayCore;
        });

    if (targetSections.length === 0) {
        new Notice('今天及以后没有可同步的格子标题。');
        return {
            changed: false,
            markdown,
        };
    }

    const todayAndFutureBatches = splitSectionsToBatches(targetSections, 120);
    const todayAndFutureResult = syncDayPlanTitlesWithBatches(
        markdown,
        todayAndFutureBatches,
    );
    if (todayAndFutureResult.changed) {
        new Notice('已根据 YAML 模板替换今天及以后的格子标题。');
    } else {
        new Notice('今天及以后的格子标题已是最新，无需同步。');
    }
    return todayAndFutureResult;
};

const syncDayPlanCenterDateHeadingWithToday = async (
    plugin: MandalaGrid,
    file: TFile,
    content: string,
) => {
    const plan = parseDayPlanFromMarkdown(content);
    if (!plan || plan.enabled !== true) return false;
    const dateHeadingSettings = getDateHeadingSettings(plugin);
    if (dateHeadingSettings.applyMode === 'manual') return false;
    const todayHeading = buildCenterDateHeading(
        getTodayIsoDate(),
        dateHeadingSettings,
    );
    if (plan.center_date_h2 === todayHeading) return false;
    await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
        const record = frontmatter as Record<string, unknown>;
        const raw = record[DAY_PLAN_FRONTMATTER_KEY];
        if (!raw || typeof raw !== 'object') return;
        const dayPlan = raw as Record<string, unknown>;
        if (dayPlan.enabled !== true) return;
        dayPlan.center_date_h2 = todayHeading;
    });
    return true;
};

export const toggleFileViewType = async (
    plugin: MandalaGrid,
    file: TFile,
    leaf: WorkspaceLeaf | undefined,
) => {
    const documents = plugin.settings.getValue().documents;
    const preferences = documents[file.path] ? documents[file.path] : null;

    const currentViewType = preferences ? preferences.viewType : 'markdown';

    let fileLeaf = leaf || getLeafOfFile(plugin, file, currentViewType);
    if (!fileLeaf) fileLeaf = await openFile(plugin, file, 'tab');

    const newViewType =
        currentViewType === 'markdown' ? MANDALA_VIEW_TYPE : 'markdown';

    if (newViewType === MANDALA_VIEW_TYPE) {
        const content = await plugin.app.vault.read(file);
        const analysis = analyzeMandalaContent(content);
        let nextContent = content;
        const conversionMode = getConversionMode(analysis);
        if (conversionMode) {
            const { title, message } = getConversionPrompt(
                analysis,
                conversionMode,
            );
            const choice = await openMandalaConversionModal(plugin, {
                title,
                message,
            });
            if (choice === 'cancel') return;
            nextContent = convertToMandalaMarkdown(
                nextContent,
                conversionMode,
            );
            if (analysis.hasSection1 && !analysis.hasSection1_1) {
                new Notice(
                    '当前非标准九宫格式，请切回 Markdown 视图核对 section 编号。',
                );
            }
        }

        const syncResult = await syncDayPlanTitlesByUserChoice(
            plugin,
            nextContent,
        );
        nextContent = syncResult.markdown;
        const dateHeadingSettings = getDateHeadingSettings(plugin);
        if (dateHeadingSettings.applyMode === 'immediate') {
            nextContent = refreshDayPlanDateHeadingsInMarkdown(
                nextContent,
                dateHeadingSettings,
            ).markdown;
        }
        const contentChangedOnEnter = nextContent !== content;
        if (contentChangedOnEnter) {
            await plugin.app.vault.modify(file, nextContent);
        }
        const centerDateUpdated = await syncDayPlanCenterDateHeadingWithToday(
            plugin,
            file,
            nextContent,
        );
        if (centerDateUpdated) {
            nextContent = await plugin.app.vault.read(file);
        }
    }
    toggleObsidianViewType(plugin, fileLeaf, newViewType);
    setViewType(plugin, file.path, newViewType);
    if (newViewType === MANDALA_VIEW_TYPE) {
        const latest = await plugin.app.vault.read(file);
        refreshMandalaViewData(plugin, file, latest);
    }
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

const getConversionPrompt = (
    analysis: ReturnType<typeof analyzeMandalaContent>,
    mode: MandalaConversionMode,
) => {
    if (analysis.hasSection1 && !analysis.hasSection1_1) {
        return {
            title: '检测到非标准九宫格式',
            message:
                '当前文件存在 section 1 但缺少 section 1.1。是否转换为标准九宫？' +
                '\n转换后会保留现有 section，可切回 Markdown 视图核对编号。',
        };
    }
    if (mode === 'template-with-content') {
        return {
            title: '是否转换为九宫格式？',
            message:
                '当前文件不是九宫格格式。转换后会创建标准九宫，并将原内容放入中心格（section 1）。',
        };
    }
    return {
        title: '是否转换为九宫格式？',
        message: '检测到 section 标记，是否启用九宫格视图并保留现有内容？',
    };
};
