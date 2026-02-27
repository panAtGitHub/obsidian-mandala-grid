import { MandalaView } from 'src/view/view';

export const deleteNode = (
    view: MandalaView,
    nodeId: string,
    includeSelection = false,
) => {
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const viewState = view.viewStore.getValue();
    if (viewState.document.pendingConfirmation.deleteNode.has(nodeId)) {
        const selectedNodes = includeSelection
            ? viewState.document.selectedNodes
            : undefined;
        if (!documentState.meta.isMandala) {
            documentStore.dispatch({
                type: 'document/delete-node',
                payload: {
                    activeNodeId: nodeId,
                    selectedNodes,
                },
            });
        }
        view.viewStore.dispatch({
            type: 'view/delete-node/reset-confirmation',
        });
    } else {
        view.viewStore.dispatch({
            type: 'view/delete-node/confirm',
            payload: {
                id: nodeId,
                includeSelection,
            },
        });
    }
};
