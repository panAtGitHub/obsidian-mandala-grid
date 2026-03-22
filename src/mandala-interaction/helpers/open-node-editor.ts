import { Platform } from 'obsidian';
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

    view.viewStore.dispatch({
        type: 'view/editor/enable-main-editor',
        payload: {
            nodeId,
            isInSidebar: options.desktopIsInSidebar,
        },
    });
};
