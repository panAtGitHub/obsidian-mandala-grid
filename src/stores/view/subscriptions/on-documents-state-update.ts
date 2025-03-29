import { LineageView } from 'src/view/view';
import { DocumentsStoreAction } from 'src/stores/documents/documents-store-actions';
import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { resetScrollPosition } from 'src/view/components/container/minimap/event-handlers/reset-scroll-position';

export const onDocumentsStateUpdate = (
    view: LineageView,
    action: DocumentsStoreAction,
) => {
    if (!view.container) return;
    if (action.type === 'WORKSPACE/ACTIVE_LEAF_CHANGE') {
        if (view.viewStore.getValue().document.editing.activeNodeId) {
            saveNodeContent(view);
        }
        if (view.isActive && view.minimapStore) {
            resetScrollPosition(view);
            view.minimapEffects.updateScrollbarPosition(view);
        }
    }
    if (
        action.type === 'WORKSPACE/SET_ACTIVE_LINEAGE_VIEW' ||
        action.type === 'WORKSPACE/RESIZE'
    ) {
        if (view.isActive) {
            focusContainer(view);
            view.plugin.statusBar.updateAll(view);
        }
        view.alignBranch.align(action);
    }
};
