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
import {
    buildCenterDateHeading,
    DAY_PLAN_FRONTMATTER_KEY,
    parseDayPlanFromMarkdown,
} from 'src/lib/mandala/day-plan';

import { setViewType } from 'src/stores/settings/actions/set-view-type';

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

const syncDayPlanCenterDateHeadingWithToday = async (
    plugin: MandalaGrid,
    file: TFile,
    content: string,
) => {
    const plan = parseDayPlanFromMarkdown(content);
    if (!plan || plan.enabled !== true) return false;
    const todayHeading = buildCenterDateHeading(getTodayIsoDate());
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

        const syncResult = syncDayPlanTitlesInMarkdown(nextContent);
        nextContent = syncResult.markdown;
        const contentChangedOnEnter = nextContent !== content;
        if (contentChangedOnEnter) {
            await plugin.app.vault.modify(file, nextContent);
        }

        if (syncResult.changed) {
            const batchPlan = createDayPlanTitleSyncBatches(nextContent, 120);
            if (!batchPlan || batchPlan.batches.length <= 1) {
                new Notice('已根据文档前置区调整的标题进行全局替换。');
            } else {
                new Notice(
                    `正在根据 YAML 后台替换标题：0/${batchPlan.total}`,
                    1200,
                );
                void runDayPlanTitleSyncInBackground(
                    plugin,
                    file,
                    nextContent,
                    batchPlan.batches,
                    batchPlan.total,
                );
            }
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

const runDayPlanTitleSyncInBackground = async (
    plugin: MandalaGrid,
    file: TFile,
    sourceMarkdown: string,
    batches: string[][],
    total: number,
) => {
    let workingMarkdown = sourceMarkdown;
    let changed = false;
    let done = 0;
    for (const sections of batches) {
        const batchResult = syncDayPlanTitlesBySections(
            workingMarkdown,
            sections,
        );
        workingMarkdown = batchResult.markdown;
        if (batchResult.changed) changed = true;
        done += sections.length;
        new Notice(`正在根据 YAML 后台替换标题：${done}/${total}`, 900);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    if (changed && workingMarkdown !== sourceMarkdown) {
        await plugin.app.vault.modify(file, workingMarkdown);
        refreshMandalaViewData(plugin, file, workingMarkdown);
    }
    new Notice('已根据 YAML 区所调整的标题进行全局替换。');
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
