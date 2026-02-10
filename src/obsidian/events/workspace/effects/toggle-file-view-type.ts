import MandalaGrid from 'src/main';
import { Notice, parseYaml, TFile, WorkspaceLeaf } from 'obsidian';
import { getLeafOfFile } from 'src/obsidian/events/workspace/helpers/get-leaf-of-file';
import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { MANDALA_VIEW_TYPE, MandalaView } from 'src/view/view';
import { openMandalaConversionModal } from 'src/obsidian/modals/mandala-conversion-modal';
import {
    analyzeMandalaContent,
    convertToMandalaMarkdown,
    MandalaConversionMode,
} from 'src/lib/mandala/mandala-conversion';
import { syncDayPlanTitlesInMarkdown } from 'src/lib/mandala/sync-day-plan-titles';
import { DAY_PLAN_FRONTMATTER_KEY, sectionFromDateInPlanYear } from 'src/lib/mandala/day-plan';

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

const getDayPlanYearFromMarkdown = (content: string) => {
    const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---\n?/);
    if (!frontmatterMatch) return null;
    try {
        const parsed: unknown = parseYaml(frontmatterMatch[1]);
        if (!parsed || typeof parsed !== 'object') return null;
        const root = parsed as Record<string, unknown>;
        const rawPlan = root[DAY_PLAN_FRONTMATTER_KEY];
        if (!rawPlan || typeof rawPlan !== 'object') return null;
        const plan = rawPlan as Record<string, unknown>;
        if (plan.enabled !== true) return null;
        const year = Number(plan.year);
        return Number.isInteger(year) ? year : null;
    } catch {
        return null;
    }
};

const focusDayPlanSection = (
    plugin: MandalaGrid,
    file: TFile,
    content: string,
) => {
    const run = (attempt: number) => {
        const leaf = getLeafOfFile(plugin, file, MANDALA_VIEW_TYPE);
        if (!leaf || !(leaf.view instanceof MandalaView)) {
            if (attempt < 8) window.setTimeout(() => run(attempt + 1), 80);
            return;
        }
        const view = leaf.view;
        const year = getDayPlanYearFromMarkdown(content);
        if (!year) return;

        const todaySection = sectionFromDateInPlanYear(year);
        const targetSection = todaySection ?? '1';
        if (!todaySection) {
            new Notice('年份错误。');
        }
        const nodeId = view.documentStore.getValue().sections.section_id[targetSection];
        if (!nodeId) return;

        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: targetSection },
        });
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse-silent',
            payload: { id: nodeId },
        });
    };
    window.setTimeout(() => run(0), 120);
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

        if (nextContent !== content) {
            await plugin.app.vault.modify(file, nextContent);
        }

        if (syncResult.changed) {
            new Notice('已根据文档前置区调整的标题进行全局替换。');
        }
    }
    toggleObsidianViewType(plugin, fileLeaf, newViewType);
    setViewType(plugin, file.path, newViewType);
    if (newViewType === MANDALA_VIEW_TYPE) {
        const latest = await plugin.app.vault.read(file);
        refreshMandalaViewData(plugin, file, latest);
        focusDayPlanSection(plugin, file, latest);
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
