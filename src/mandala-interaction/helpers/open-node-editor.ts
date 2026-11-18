import { Platform } from 'obsidian';
import { closeNodeEditor } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import type { MandalaView } from 'src/view/view';

type OpenNodeEditorOptions = {
    desktopIsInSidebar: boolean;
};

export const openNodeEditor = (
    view: MandalaView,
    nodeId: string,
    options: OpenNodeEditorOptions,
) => {
    if (Platform.isMobile) {
        void import(
            'src/obsidian/helpers/inline-editor/section-native-editor-session'
        ).then(({ startSectionNativeEditorSession }) => {
            void startSectionNativeEditorSession(view, nodeId);
        });
        return;
    }

    const editingPane = view.getEditingPane();
    if (
        editingPane === view &&
        view.viewStore.getValue().document.editing.activeNodeId === nodeId
    )
        return;

    if (editingPane) closeNodeEditor(editingPane);
    view.viewStore.dispatch({
        type: 'view/editor/enable-main-editor',
        payload: {
            nodeId,
            isInSidebar: options.desktopIsInSidebar,
        },
    });
};
