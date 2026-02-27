import { MandalaView } from 'src/view/view';
import { ViewStoreAction } from 'src/stores/view/view-store-actions';
import { getViewEventType } from 'src/stores/view/helpers/get-view-event-type';
import { updateSearchResults } from 'src/stores/view/subscriptions/actions/update-search-results';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { persistActiveNodeInPluginSettings } from 'src/stores/view/subscriptions/actions/persist-active-node-in-plugin-settings';
import { getUsedHotkeys } from 'src/obsidian/helpers/get-used-hotkeys';

export const onViewStateUpdate = (
    view: MandalaView,
    action: ViewStoreAction,
    localState: { previousActiveNode: string },
) => {
    const viewStore = view.viewStore;
    const viewState = viewStore.getValue();
    const container = view.container;

    const type = action.type;

    const e = getViewEventType(type);

    const activeNodeChange = e.activeNode || e.activeNodeHistory;
    const activeNodeHasChanged =
        localState.previousActiveNode !== viewState.document.activeNode;
    if (activeNodeHasChanged) {
        localState.previousActiveNode = viewState.document.activeNode;
    }
    if (activeNodeChange && activeNodeHasChanged) {
        persistActiveNodeInPluginSettings(view);
        void view.plugin.statusBar.updateProgressIndicatorAndChildCount(view);
    }
    if (action.type === 'view/search/set-query') {
        updateSearchResults(view);
    }

    // effects
    if (
        e.search ||
        e.mainEditor ||
        action.type === 'view/update-active-branch?source=document' ||
        (activeNodeChange && activeNodeHasChanged)
    ) {
        view.alignBranch.align(action);
    }
    if (!container || !view.isViewOfFile) return;

    if (type === 'view/search/toggle-fuzzy-mode') {
        view.documentSearch.resetIndex();
    }

    if (
        action.type === 'view/editor/disable-main-editor' ||
        action.type === 'view/editor/disable-sidebar-editor' ||
        action.type === 'view/set-active-node/history/select-next' ||
        action.type === 'view/set-active-node/history/select-previous'
    ) {
        focusContainer(view);
    }
    if (action.type === 'view/search/toggle-input') {
        if (!viewState.search.showInput) {
            focusContainer(view);
        }
    }

    if (action.type === 'view/hotkeys/toggle-modal') {
        if (viewState.ui.controls.showHelpSidebar) {
            view.viewStore.dispatch({
                type: 'view/hotkeys/update-conflicts',
                payload: {
                    conflicts: getUsedHotkeys(view.plugin),
                },
            });
        }
    }
};
