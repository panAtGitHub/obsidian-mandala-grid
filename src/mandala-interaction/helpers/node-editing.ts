import { closeNodeEditor } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import type { MandalaView } from 'src/view/view';
import { openNodeEditor } from 'src/mandala-interaction/helpers/open-node-editor';

export const setActiveMandalaNode = (
    view: MandalaView,
    nodeId: string,
    silent = false,
) => {
    const { activeNode: previousNodeId, editing } =
        view.viewStore.getValue().document;
    if (editing.activeNodeId && editing.activeNodeId !== nodeId) {
        closeNodeEditor(view);
    }
    if (previousNodeId && previousNodeId !== nodeId) {
        const startedAt = performance.now();
        view.recordPerfAfterNextPaint(
            'interaction.active-node.mouse',
            startedAt,
            {
                action_type: silent
                    ? 'view/set-active-node/mouse-silent'
                    : 'view/set-active-node/mouse',
                from_node_id: previousNodeId,
                to_node_id: nodeId,
                silent,
            },
        );
    }
    view.viewStore.dispatch({
        type: silent
            ? 'view/set-active-node/mouse-silent'
            : 'view/set-active-node/mouse',
        payload: { id: nodeId },
    });
};

export const enableSidebarEditorForNode = (
    view: MandalaView,
    nodeId: string,
) => {
    openNodeEditor(view, nodeId, {
        desktopIsInSidebar: true,
    });
};

export const ensureMandalaDetailSidebarVisible = (view: MandalaView) => {
    const showDetailSidebar = view.isMandalaDetailSidebarVisible();
    if (showDetailSidebar) return;
    view.toggleCurrentMandalaDetailSidebar();
};

export const openSidebarAndEditMandalaNode = (
    view: MandalaView,
    nodeId: string,
) => {
    ensureMandalaDetailSidebarVisible(view);
    setActiveMandalaNode(view, nodeId, true);
    enableSidebarEditorForNode(view, nodeId);
};
