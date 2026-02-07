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

import { setViewType } from 'src/stores/settings/actions/set-view-type';

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
            const nextContent = convertToMandalaMarkdown(
                content,
                conversionMode,
            );
            await plugin.app.vault.modify(file, nextContent);
            if (analysis.hasSection1 && !analysis.hasSection1_1) {
                new Notice(
                    '当前非标准九宫格式，请切回 Markdown 视图核对 section 编号。',
                );
            }
        }
    }
    toggleObsidianViewType(plugin, fileLeaf, newViewType);
    setViewType(plugin, file.path, newViewType);
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
