import { MandalaView } from 'src/view/view';

export const saveNodeContent = (view: MandalaView, modKey = false) => {
    if (view.inlineEditor.nodeId) {
        view.inlineEditor.requestSave();
        const isInSidebar =
            view.viewStore.getValue().document.editing.isInSidebar;
        if (isInSidebar) {
            view.viewStore.dispatch({
                type: 'view/editor/disable-sidebar-editor',
                context: {
                    modKey,
                },
            });
        } else {
            view.viewStore.dispatch({
                type: 'view/editor/disable-main-editor',
                context: {
                    modKey,
                },
            });
        }
    }
};
