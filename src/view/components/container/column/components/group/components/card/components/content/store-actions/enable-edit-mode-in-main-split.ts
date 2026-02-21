import { LineageView } from 'src/view/view';
import { Platform } from 'obsidian';
import { startSectionNativeEditorSession } from 'src/view/helpers/lineage/section-native-editor-session';

export const enableEditModeInMainSplit = (
    view: LineageView,
    nodeId: string,
) => {
    if (Platform.isMobile) {
        void startSectionNativeEditorSession(view, nodeId);
        return;
    }
    view.viewStore.dispatch({
        type: 'view/editor/enable-main-editor',
        payload: {
            nodeId,
        },
    });
};
