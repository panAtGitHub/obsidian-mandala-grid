import type { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';

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
    view.viewStore.dispatch({
        type: 'view/editor/enable-main-editor',
        payload: { nodeId, isInSidebar: true },
    });
};

export const ensureMandalaDetailSidebarVisible = (view: MandalaView) => {
    const showDetailSidebar = Platform.isMobile
        ? view.plugin.settings.getValue().view.showMandalaDetailSidebarMobile
        : view.plugin.settings.getValue().view.showMandalaDetailSidebarDesktop;
    if (showDetailSidebar) return;
    view.plugin.settings.dispatch({
        type: 'view/mandala-detail-sidebar/toggle',
    });
};

export const openSidebarAndEditMandalaNode = (
    view: MandalaView,
    nodeId: string,
) => {
    ensureMandalaDetailSidebarVisible(view);
    setActiveMandalaNode(view, nodeId, true);
    enableSidebarEditorForNode(view, nodeId);
};
