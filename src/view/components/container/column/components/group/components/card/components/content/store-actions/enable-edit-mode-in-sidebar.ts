import { MandalaView } from 'src/view/view';

export const enableEditModeInSidebar = (view: MandalaView, nodeId: string) => {
    view.viewStore.dispatch({
        type: 'view/editor/enable-sidebar-editor',
        payload: {
            id: nodeId,
        },
        context: {
            activeSidebarTab: 'pinned-cards',
        },
    });
};
