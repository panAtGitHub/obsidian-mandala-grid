import { SplitNodeModal } from 'src/view/modals/split-node-modal/split-node-modal';
import { MandalaView } from 'src/view/view';
import { get } from 'svelte/store';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';

export const openSplitNodeModal = async (view: MandalaView) => {
    const viewState = view.viewStore.getValue();
    const activeNode = viewState.document.activeNode;
    if (!activeNode) return;

    const isEditing = Boolean(viewState.document.editing.activeNodeId);
    if (isEditing) {
        saveNodeContent(view);
        setTimeout(() => {
            void openSplitNodeModal(view);
        }, 100);
        return;
    }

    const documentState = view.documentStore.getValue();
    const nodeContent = documentState.document.content[activeNode].content;
    const modal = new SplitNodeModal({
        plugin: view.plugin,
        callbacks: {
            accept: () => {
                modal.close();
                void get(modal.state.content);
                void get(modal.state.mode);
                void nodeContent;
                void activeNode;
            },
            reject: () => {
                modal.close();
            },
        },
        nodeContent,
    });
    await modal.openWithPromise();
};
