import { LineageView } from 'src/view/view';

export const saveNodeContent = (view: LineageView, modKey = false) => {
    if (view.inlineEditor.nodeId) {
        view.inlineEditor.unloadNode();
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
