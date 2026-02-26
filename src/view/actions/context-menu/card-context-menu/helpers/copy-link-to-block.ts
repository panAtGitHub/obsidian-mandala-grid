import { MandalaView } from 'src/view/view';
import { insertBlockId } from 'src/view/actions/context-menu/card-context-menu/helpers/insert-block-id';
import { Notice } from 'obsidian';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { formatWikiLink } from 'src/view/actions/context-menu/card-context-menu/helpers/format-wiki-link';

type CopyLinkToBlockOptions = {
    embed?: boolean;
};

export const buildBlockWikiLink = (
    fileName: string,
    blockId: string,
    embed = false,
) => formatWikiLink(`${fileName}#^${blockId}`, embed);

export const copyLinkToBlock = async (
    view: MandalaView,
    isInSidebar: boolean,
    options?: CopyLinkToBlockOptions,
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
            void copyLinkToBlock(view, isInSidebar, options);
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
        const link = buildBlockWikiLink(
            fileName,
            output.blockId,
            options?.embed ?? false,
        );
        await navigator.clipboard.writeText(link);
        new Notice('Copied');
    } else {
        new Notice('Could not copy link to clipboard');
    }
};
