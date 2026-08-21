import { MandalaView } from 'src/view/view';
import { isMandalaEditing } from 'src/view/helpers/editor-focus-state';

export const saveNodeContent = (view: MandalaView, modKey = false) => {
    if (!isMandalaEditing(view)) return;

    view.inlineEditor.requestSave();
    const isInSidebar = view.viewStore.getValue().document.editing.isInSidebar;
    view.viewStore.dispatch({
        type: isInSidebar
            ? 'view/editor/disable-sidebar-editor'
            : 'view/editor/disable-main-editor',
        context: {
            modKey,
        },
    });
};
