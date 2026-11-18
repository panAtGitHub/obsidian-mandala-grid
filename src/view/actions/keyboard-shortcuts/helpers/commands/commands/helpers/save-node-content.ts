import type { MandalaView } from 'src/view/view';

export const closeNodeEditor = (view: MandalaView, modKey = false) => {
    const { editing } = view.viewStore.getValue().document;
    if (!editing.activeNodeId) return;
    view.inlineEditor?.unloadNode();
    view.viewStore.dispatch({
        type: editing.isInSidebar
            ? 'view/editor/disable-sidebar-editor'
            : 'view/editor/disable-main-editor',
        context: { modKey },
    });
    view.refreshAfterEdit?.();
};

export const saveNodeContent = async (view: MandalaView, modKey = false) => {
    const nodeId = view.viewStore.getValue().document.editing.activeNodeId;
    if (!nodeId || !view.inlineEditor) return false;
    if (!(await view.inlineEditor.requestSave())) return false;
    if (view.viewStore.getValue().document.editing.activeNodeId === nodeId) {
        closeNodeEditor(view, modKey);
    }
    return true;
};
