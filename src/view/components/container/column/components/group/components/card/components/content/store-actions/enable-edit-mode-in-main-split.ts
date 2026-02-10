import { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';

export const enableEditModeInMainSplit = (
    view: MandalaView,
    nodeId: string,
) => {
    const editing = view.viewStore.getValue().document.editing;
    if (editing.activeNodeId === nodeId && !editing.isInSidebar) return;
    const showDetailSidebar = Platform.isMobile
        ? view.plugin.settings.getValue().view.showMandalaDetailSidebarMobile
        : view.plugin.settings.getValue().view.showMandalaDetailSidebarDesktop;
    view.viewStore.dispatch({
        type: 'view/editor/enable-main-editor',
        payload: {
            nodeId,
            isInSidebar: showDetailSidebar,
        },
    });
};
