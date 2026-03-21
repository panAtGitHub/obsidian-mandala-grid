import { MandalaView } from 'src/view/view';
import { isMacLike } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/mod-key';

export const setActiveMainSplitNode = (
    view: MandalaView,
    nodeId: string,
    e: MouseEvent,
) => {
    const silent = isMacLike ? e.metaKey : e.ctrlKey;
    view.viewStore.dispatch({
        type: silent
            ? 'view/set-active-node/mouse-silent'
            : 'view/set-active-node/mouse',
        payload: { id: nodeId },
    });
};
