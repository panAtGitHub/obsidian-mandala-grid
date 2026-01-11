import { LineageView } from 'src/view/view';

export const enableEditModeInMainSplit = (
    view: LineageView,
    nodeId: string,
) => {
    const editing = view.viewStore.getValue().document.editing;
    if (editing.activeNodeId === nodeId && !editing.isInSidebar) return;
    view.viewStore.dispatch({
        type: 'view/editor/enable-main-editor',
        payload: {
            nodeId,
        },
    });
};
