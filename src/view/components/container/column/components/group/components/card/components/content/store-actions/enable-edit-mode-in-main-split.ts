import { LineageView } from 'src/view/view';

export const enableEditModeInMainSplit = (
    view: LineageView,
    nodeId: string,
) => {
    view.viewStore.dispatch({
        type: 'view/editor/enable-main-editor',
        payload: {
            nodeId,
        },
    });
};
