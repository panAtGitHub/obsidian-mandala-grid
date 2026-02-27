import { MandalaView } from 'src/view/view';

export const selectInactiveCard = (
    view: MandalaView,
    closestCardElement: HTMLElement,
    isInSidebar: boolean,
) => {
    const id = closestCardElement?.id;
    if (!isInSidebar) {
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse-silent',
            payload: {
                id,
            },
        });
    } else {
        view.viewStore.dispatch({
            type: 'view/pinned-nodes/set-active-node',
            payload: {
                id,
            },
        });
    }
};
