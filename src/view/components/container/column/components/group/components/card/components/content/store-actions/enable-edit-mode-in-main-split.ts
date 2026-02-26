import { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';
import { openNodeEditor } from 'src/view/helpers/mandala/open-node-editor';

export const enableEditModeInMainSplit = (
    view: MandalaView,
    nodeId: string,
) => {
    const editing = view.viewStore.getValue().document.editing;
    if (
        !Platform.isMobile &&
        editing.activeNodeId === nodeId &&
        !editing.isInSidebar
    )
        return;
    const showDetailSidebar = Platform.isMobile
        ? view.plugin.settings.getValue().view.showMandalaDetailSidebarMobile
        : view.plugin.settings.getValue().view.showMandalaDetailSidebarDesktop;
    openNodeEditor(view, nodeId, {
        desktopIsInSidebar: showDetailSidebar,
    });
};
