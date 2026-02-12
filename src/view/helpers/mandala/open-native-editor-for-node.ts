import { MarkdownView } from 'obsidian';
import { toggleObsidianViewType } from 'src/obsidian/events/workspace/effects/toggle-obsidian-view-type';
import { setViewType } from 'src/stores/settings/actions/set-view-type';
import { findSectionPosition } from 'src/view/components/container/column/components/group/components/card/components/card-buttons/helpers/find-section-position';
import type { MandalaView } from 'src/view/view';

const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 25;

const waitForMarkdownView = async (
    view: MandalaView,
): Promise<MarkdownView | null> => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const markdownView = view.leaf.view as MarkdownView;
        if (
            markdownView?.getViewType?.() === 'markdown' &&
            markdownView.editor
        ) {
            return markdownView;
        }
        await new Promise<void>((resolve) =>
            window.setTimeout(resolve, RETRY_DELAY_MS),
        );
    }
    return null;
};

export const openNativeEditorForNode = async (
    view: MandalaView,
    nodeId: string,
): Promise<void> => {
    const file = view.file;
    if (!file) return;

    const line = findSectionPosition(view, nodeId);
    if (line === undefined) return;

    const editingState = view.viewStore.getValue().document.editing;
    if (editingState.activeNodeId) {
        view.viewStore.dispatch({
            type: 'view/editor/disable-main-editor',
        });
    }

    setViewType(view.plugin, file.path, 'markdown');
    toggleObsidianViewType(view.plugin, view.leaf, 'markdown');

    const markdownView = await waitForMarkdownView(view);
    if (!markdownView) return;
    if (markdownView.file?.path !== file.path) {
        await view.leaf.openFile(file);
    }
    markdownView.editor.setCursor({ line, ch: 0 });
};
