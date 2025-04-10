import { LineageView } from 'src/view/view';
import { insertBlockId } from 'src/view/actions/context-menu/card-context-menu/helpers/insert-block-id';
import { Notice } from 'obsidian';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';

export const copyLinkToBlock = async (
    view: LineageView,
    isInSidebar: boolean,
) => {
    const file = view.file;
    if (!file) return;
    const viewState = view.viewStore.getValue();
    const activeTab = view.plugin.settings.getValue().view.leftSidebarActiveTab;
    const activeNode = isInSidebar
        ? activeTab === 'pinned-cards'
            ? viewState.pinnedNodes.activeNode
            : viewState.recentNodes.activeNode
        : viewState.document.activeNode;

    const isEditing = Boolean(viewState.document.editing.activeNodeId);
    if (isEditing) {
        saveNodeContent(view);
        setTimeout(() => {
            copyLinkToBlock(view, isInSidebar);
        }, 100);
        return;
    }

    const documentState = view.documentStore.getValue();
    const content = documentState.document.content[activeNode];
    const text = content?.content;

    const output = insertBlockId(text);
    if (output) {
        const fileName = file.basename;
        view.documentStore.dispatch({
            type: 'document/update-node-content',
            payload: {
                content: output.text,
                nodeId: activeNode,
            },
            context: {
                isInSidebar: viewState.document.editing.isInSidebar,
            },
        });
        const link = `[[${fileName}#^${output.blockId}]]`;
        await navigator.clipboard.writeText(link);
        new Notice('Copied');
    } else {
        new Notice('Could not copy link to clipboard');
    }
};
