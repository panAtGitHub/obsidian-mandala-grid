import { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';
import { openNodeEditor } from 'src/mandala-interaction/helpers/open-node-editor';

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
    const showDetailSidebar = view.isMandalaDetailSidebarVisible();
    openNodeEditor(view, nodeId, {
        desktopIsInSidebar: showDetailSidebar,
    });
};
