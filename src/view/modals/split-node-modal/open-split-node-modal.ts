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
                const newContent = get(modal.state.content);
                const mode = get(modal.state.mode);
                if (mode && newContent !== nodeContent) {
                    if (view.documentStore.getValue().meta.isMandala) return;
                    view.documentStore.dispatch({
                        type: 'document/split-node',
                        payload: {
                            target: activeNode,
                            mode: mode,
                        },
                    });
                }
            },
            reject: () => {
                modal.close();
            },
        },
        nodeContent,
    });
    await modal.openWithPromise();
};
