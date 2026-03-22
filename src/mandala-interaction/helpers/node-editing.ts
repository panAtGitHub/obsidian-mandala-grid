import type { MandalaView } from 'src/view/view';
import { openNodeEditor } from 'src/mandala-interaction/helpers/open-node-editor';

export const setActiveMandalaNode = (
    view: MandalaView,
    nodeId: string,
    silent = false,
) => {
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
