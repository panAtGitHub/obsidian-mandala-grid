import { MandalaView } from 'src/view/view';
import { ViewStoreAction } from 'src/stores/view/view-store-actions';
import { getViewEventType } from 'src/stores/view/helpers/get-view-event-type';
import { updateSearchResults } from 'src/stores/view/subscriptions/actions/update-search-results';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { persistActiveNodeInPluginSettings } from 'src/stores/view/subscriptions/actions/persist-active-node-in-plugin-settings';
import { getUsedHotkeys } from 'src/obsidian/helpers/get-used-hotkeys';

const NAVIGATION_ACTIVE_NODE_ACTIONS = new Set<ViewStoreAction['type']>([
    'view/set-active-node/core-jump',
    'view/set-active-node/9x9-nav',
    'view/set-active-node/nx9-nav',
    'view/set-active-node/focus-section',
]);

const NAVIGATION_ACTIVE_NODE_DEBOUNCE_MS = 120;

export type ViewSubscriptionLocalState = {
    previousActiveNode: string;
    navigationSideEffectsTimer: number | null;
    hasPendingNavigationSideEffects: boolean;
};

const clearPendingNavigationSideEffects = (
    localState: ViewSubscriptionLocalState,
) => {
    if (localState.navigationSideEffectsTimer !== null) {
        window.clearTimeout(localState.navigationSideEffectsTimer);
        localState.navigationSideEffectsTimer = null;
    }
    localState.hasPendingNavigationSideEffects = false;
};

const runActiveNodeSideEffects = (view: MandalaView) => {
    persistActiveNodeInPluginSettings(view);
    void view.plugin.statusBar.updateProgressIndicatorAndChildCount(view);
};

const scheduleNavigationSideEffects = (
    view: MandalaView,
    localState: ViewSubscriptionLocalState,
) => {
    localState.hasPendingNavigationSideEffects = true;
    if (localState.navigationSideEffectsTimer !== null) {
        window.clearTimeout(localState.navigationSideEffectsTimer);
    }
    localState.navigationSideEffectsTimer = window.setTimeout(() => {
        localState.navigationSideEffectsTimer = null;
        if (!localState.hasPendingNavigationSideEffects) return;
        localState.hasPendingNavigationSideEffects = false;
        runActiveNodeSideEffects(view);
    }, NAVIGATION_ACTIVE_NODE_DEBOUNCE_MS);
};

export const flushPendingViewSideEffects = (
    view: MandalaView,
    localState: ViewSubscriptionLocalState,
) => {
    if (localState.navigationSideEffectsTimer !== null) {
        window.clearTimeout(localState.navigationSideEffectsTimer);
        localState.navigationSideEffectsTimer = null;
    }
    if (!localState.hasPendingNavigationSideEffects) return;
    localState.hasPendingNavigationSideEffects = false;
    runActiveNodeSideEffects(view);
};

export const onViewStateUpdate = (
    view: MandalaView,
    action: ViewStoreAction,
    localState: ViewSubscriptionLocalState,
) => {
    const viewStore = view.viewStore;
    const viewState = viewStore.getValue();
    const container = view.container;

    const type = action.type;

    const e = getViewEventType(type);

    const activeNodeChange = e.activeNode || e.activeNodeHistory;
    const previousActiveNode = localState.previousActiveNode || null;
    const nextActiveNode = viewState.document.activeNode || null;
    const activeNodeHasChanged = previousActiveNode !== nextActiveNode;
    if (activeNodeHasChanged) {
        localState.previousActiveNode = viewState.document.activeNode;
    }
    if (activeNodeChange && activeNodeHasChanged) {
        view.recordPerfEvent('view.active-node.changed', {
            action_type: action.type,
            prev_node_id: previousActiveNode,
            next_node_id: nextActiveNode,
        });
        if (NAVIGATION_ACTIVE_NODE_ACTIONS.has(action.type)) {
            scheduleNavigationSideEffects(view, localState);
        } else {
            clearPendingNavigationSideEffects(localState);
            runActiveNodeSideEffects(view);
        }
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
        action.type === 'view/editor/disable-sidebar-editor'
    ) {
        if (viewState.ui.previewDialog.open) {
            return;
        }
        focusContainer(view);
    }
    if (action.type === 'view/preview-dialog/close') {
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
