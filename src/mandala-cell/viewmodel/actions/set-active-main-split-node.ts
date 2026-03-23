import { MandalaView } from 'src/view/view';
import { isMacLike } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/mod-key';

export const setActiveMainSplitNode = (
    view: MandalaView,
    nodeId: string,
    e: MouseEvent,
) => {
    const silent = isMacLike ? e.metaKey : e.ctrlKey;
    const previousNodeId = view.viewStore.getValue().document.activeNode;
    if (previousNodeId && previousNodeId !== nodeId) {
        const startedAt = performance.now();
        view.recordPerfAfterNextPaint('interaction.active-node.mouse', startedAt, {
            action_type: silent ? 'view/set-active-node/mouse-silent' : 'view/set-active-node/mouse',
            from_node_id: previousNodeId,
            to_node_id: nodeId,
            silent,
        });
    }
    view.viewStore.dispatch({
        type: silent
            ? 'view/set-active-node/mouse-silent'
            : 'view/set-active-node/mouse',
        payload: { id: nodeId },
    });
};
