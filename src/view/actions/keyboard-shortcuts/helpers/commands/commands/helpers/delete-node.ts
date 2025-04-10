import { LineageView } from 'src/view/view';

export const deleteNode = (
    view: LineageView,
    nodeId: string,
    includeSelection = false,
) => {
    const documentStore = view.documentStore;
    const viewState = view.viewStore.getValue();
    if (viewState.document.pendingConfirmation.deleteNode.has(nodeId)) {
        const selectedNodes = includeSelection
            ? viewState.document.selectedNodes
            : undefined;
        documentStore.dispatch({
            type: 'document/delete-node',
            payload: {
                activeNodeId: nodeId,
                selectedNodes,
            },
        });
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
