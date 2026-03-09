import { MandalaView } from 'src/view/view';

export const setActiveSidebarNode = (view: MandalaView, id: string) => {
    view.viewStore.dispatch({
        type: 'view/pinned-nodes/set-active-node',
        payload: { id },
    });
};
