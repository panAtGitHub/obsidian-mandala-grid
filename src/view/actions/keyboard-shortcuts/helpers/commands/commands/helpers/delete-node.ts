import { MandalaView } from 'src/view/view';

export const deleteNode = (
    view: MandalaView,
    nodeId: string,
    includeSelection = false,
) => {
    const viewState = view.viewStore.getValue();
    if (viewState.document.pendingConfirmation.deleteNode.has(nodeId)) {
        void includeSelection;
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
