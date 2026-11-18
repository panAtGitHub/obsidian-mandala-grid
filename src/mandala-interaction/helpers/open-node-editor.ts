import { Platform } from 'obsidian';
import { resolveDraftExit } from 'src/view/edit-session/resolve-draft-exit';
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

    const open = () =>
        view.viewStore.dispatch({
            type: 'view/editor/enable-main-editor',
            payload: {
                nodeId,
                isInSidebar: options.desktopIsInSidebar,
            },
        });
    const editingPane = view.getEditingPane?.();
    if (!editingPane) {
        open();
        return;
    }
    if (
        editingPane === view &&
        view.viewStore.getValue().document.editing.activeNodeId === nodeId
    )
        return;
    const file = view.file;
    void resolveDraftExit(editingPane).then((mayExit) => {
        if (mayExit && view.file === file && !view.getEditingPane()) open();
    });
};
