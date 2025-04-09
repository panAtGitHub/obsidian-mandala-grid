import { LineageView } from 'src/view/view';
import { PluginStoreActions } from 'src/stores/plugin/plugin-store-actions';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';

export const onPluginStateUpdate = (
    view: LineageView,
    action: PluginStoreActions,
) => {
    if (!view.container) return;
    if (action.type === 'plugin/echo/workspace/active-leaf-change') {
        if (view.viewStore.getValue().document.editing.activeNodeId) {
            saveNodeContent(view);
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
