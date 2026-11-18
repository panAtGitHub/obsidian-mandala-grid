import { MandalaView } from 'src/view/view';
import { PluginStoreActions } from 'src/stores/plugin/plugin-store-actions';
import { closeNodeEditor } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';

export const onPluginStateUpdate = (
    view: MandalaView,
    action: PluginStoreActions,
) => {
    if (!view.container) return;
    if (action.type === 'plugin/echo/workspace/active-leaf-change') {
        if (!view.isActive) closeNodeEditor(view);
        if (view.isActive && view.isViewOfFile) {
            view.ensureCompatibleMandalaMode();
        }
    }
    if (
        action.type === 'plugin/documents/update-active-view-of-document' ||
        action.type === 'plugin/echo/workspace/resize'
    ) {
        if (view.isActive) {
            focusContainer(view);
            view.plugin.statusBar.updateAll(view);
        }
        view.alignBranch.align(action);
    }
};
