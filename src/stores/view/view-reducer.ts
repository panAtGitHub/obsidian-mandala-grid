import { ViewState } from 'src/stores/view/view-state-type';
import { ViewStoreAction } from 'src/stores/view/view-store-actions';
import { setSearchQuery } from 'src/stores/view/reducers/search/set-search-query';
import { setSearchResults } from 'src/stores/view/reducers/search/set-search-results';
import { toggleSearchInput } from 'src/stores/view/reducers/search/toggle-search-input';
import { enableEditMode } from 'src/stores/view/reducers/document/enable-edit-mode';
import { disableEditMode } from 'src/stores/view/reducers/document/disable-edit-mode';
import { onDragStart } from 'src/stores/view/reducers/document/on-drag-start';
import { onDragEnd } from 'src/stores/view/reducers/document/on-drag-end';
import { updateActiveBranch } from 'src/stores/view/reducers/document/helpers/update-active-branch';
import { updateActiveNode } from 'src/stores/view/reducers/document/helpers/update-active-node';
import { navigateUsingKeyboard } from 'src/stores/view/reducers/document/navigate-using-keyboard';
import { navigateActiveNodeHistory } from 'src/stores/view/reducers/ui/navigate-active-node-history';
import { jumpToNode } from 'src/stores/view/reducers/document/jump-to-node';

import { removeDeletedNavigationItems } from 'src/stores/view/reducers/ui/helpers/remove-deleted-navigation-items';
import { toggleFuzzySearch } from 'src/stores/view/reducers/search/toggle-fuzzy-search';
import { resetSelectionState } from 'src/stores/view/reducers/document/helpers/reset-selection-state';
import { navigateActiveNode } from 'src/stores/view/reducers/ui/navigate-active-node';
import { setActivePinnedNode } from 'src/stores/view/reducers/pinned-cards/set-active-pinned-node';
import { setActiveRecentNode } from 'src/stores/view/reducers/recent-nodes/set-active-recent-node';
import { toggleShowAllNodes } from 'src/stores/view/reducers/search/toggle-show-all-nodes';
import { resetPendingConfirmation } from 'src/stores/view/reducers/document/reset-pending-confirmation';
import { toggleCollapseNode } from 'src/stores/view/reducers/outline/toggle-collapse-node';
import { refreshCollapsedNodes } from 'src/stores/view/reducers/outline/refresh-collapsed-nodes';
import { toggleCollapseAllNodes } from 'src/stores/view/reducers/outline/toggle-collapse-all-nodes';
import { collapseNode } from 'src/stores/view/reducers/outline/helpers/collapse-node';
import { expandParentsOfActiveNode } from 'src/stores/view/reducers/outline/expand-parents-of-active-node';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';
import { selectAllNodes } from 'src/stores/view/reducers/selection/select-all-nodes';

type ViewActionHandler = (
    state: ViewState,
    action: ViewStoreAction,
    context: MandalaGridDocument,
) => void;

const handlers: Record<string, ViewActionHandler> = {
    'view/set-active-node/mouse': (state, action) => {
        if (action.type !== 'view/set-active-node/mouse') return;
        updateActiveNode(state.document, action.payload.id, state);
        if (!state.document.selectedNodes.has(state.document.activeNode)) {
            resetSelectionState(state.document);
        }
    },
    'view/set-active-node/mouse-silent': (state, action) => {
        if (action.type !== 'view/set-active-node/mouse-silent') return;
        updateActiveNode(state.document, action.payload.id, state);
        if (!state.document.selectedNodes.has(state.document.activeNode)) {
            resetSelectionState(state.document);
        }
    },
    'view/set-active-node/document': (state, action) => {
        if (action.type !== 'view/set-active-node/document') return;
        updateActiveNode(state.document, action.payload.id, state);
        if (!state.document.selectedNodes.has(state.document.activeNode)) {
            resetSelectionState(state.document);
        }
    },
    'view/set-active-node/search': (state, action) => {
        if (action.type !== 'view/set-active-node/search') return;
        updateActiveNode(state.document, action.payload.id, state);
        if (!state.document.selectedNodes.has(state.document.activeNode)) {
            resetSelectionState(state.document);
        }
    },
    'view/set-active-node/keyboard': (state, action, context) => {
        if (action.type !== 'view/set-active-node/keyboard') return;
        navigateUsingKeyboard(state.document, state, action, context.columns);
    },
    'view/search/set-query': (state, action) => {
        if (action.type !== 'view/search/set-query') return;
        setSearchQuery(state, action.payload.query);
    },
    'view/search/set-results': (state, action) => {
        if (action.type !== 'view/search/set-results') return;
        setSearchResults(state, action.payload.results);
    },
    'view/search/toggle-input': (state, action) => {
        if (action.type !== 'view/search/toggle-input') return;
        toggleSearchInput(state);
    },
    'view/snapshots/toggle-modal': (state, action) => {
        if (action.type !== 'view/snapshots/toggle-modal') return;
        const showHistorySidebar = state.ui.controls.showHistorySidebar;
        state.ui.controls = {
            showHistorySidebar: !showHistorySidebar,
            showHelpSidebar: false,
            showSettingsSidebar: false,
            showStyleRulesModal: false,
        };
    },
    'view/hotkeys/toggle-modal': (state, action) => {
        if (action.type !== 'view/hotkeys/toggle-modal') return;
        const showHelpSidebar = state.ui.controls.showHelpSidebar;
        state.ui.controls = {
            showHistorySidebar: false,
            showHelpSidebar: !showHelpSidebar,
            showSettingsSidebar: false,
            showStyleRulesModal: false,
        };
    },
    'view/settings/toggle-modal': (state, action) => {
        if (action.type !== 'view/settings/toggle-modal') return;
        const showSettingsSidebar = state.ui.controls.showSettingsSidebar;
        state.ui.controls = {
            showHistorySidebar: false,
            showHelpSidebar: false,
            showSettingsSidebar: !showSettingsSidebar,
            showStyleRulesModal: false,
        };
    },
    'view/close-modals': (state, action) => {
        if (action.type !== 'view/close-modals') return;
        state.ui.controls = {
            showHistorySidebar: false,
            showHelpSidebar: action.payload?.closeAllModals
                ? false
                : state.ui.controls.showHelpSidebar,
            showSettingsSidebar: false,
            showStyleRulesModal: false,
        };
    },
    'view/editor/enable-main-editor': (state, action) => {
        if (action.type !== 'view/editor/enable-main-editor') return;
        if (state.document.activeNode !== action.payload.nodeId) {
            updateActiveNode(state.document, action.payload.nodeId, state);
        }
        enableEditMode(state.document, action.payload.nodeId, action.payload.isInSidebar);
    },
    'view/editor/enable-sidebar-editor': (state, action) => {
        if (action.type !== 'view/editor/enable-sidebar-editor') return;
        if (action.context.activeSidebarTab === 'pinned-cards') {
            if (state.pinnedNodes.activeNode !== action.payload.id) {
                setActivePinnedNode(
                    state.document,
                    state.pinnedNodes,
                    action.payload.id,
                );
            }
        } else if (action.context.activeSidebarTab === 'recent-cards') {
            if (state.recentNodes.activeNode !== action.payload.id) {
                setActiveRecentNode(
                    state.document,
                    state.recentNodes,
                    action.payload.id,
                );
            }
        }
        enableEditMode(state.document, action.payload.id, true);
    },
    'view/editor/disable/reset-confirmation': (state, action) => {
        if (action.type !== 'view/editor/disable/reset-confirmation') return;
        resetPendingConfirmation(state.document);
    },
    'view/delete-node/reset-confirmation': (state, action) => {
        if (action.type !== 'view/delete-node/reset-confirmation') return;
        resetPendingConfirmation(state.document);
    },
    'view/delete-node/confirm': (state, action) => {
        if (action.type !== 'view/delete-node/confirm') return;
        state.document.pendingConfirmation = {
            ...state.document.pendingConfirmation,
            deleteNode:
                action.payload.includeSelection &&
                state.document.selectedNodes.size > 1
                ? new Set(state.document.selectedNodes)
                : new Set([action.payload.id]),
        };
    },
    'view/editor/disable/confirm': (state, action) => {
        if (action.type !== 'view/editor/disable/confirm') return;
        state.document.pendingConfirmation = {
            ...state.document.pendingConfirmation,
            disableEdit: action.payload.id,
        };
    },
    'view/editor/disable-main-editor': (state, action) => {
        if (action.type !== 'view/editor/disable-main-editor') return;
        disableEditMode(state.document);
    },
    'view/editor/disable-sidebar-editor': (state, action) => {
        if (action.type !== 'view/editor/disable-sidebar-editor') return;
        disableEditMode(state.document);
    },
    'view/dnd/set-drag-started': (state, action) => {
        if (action.type !== 'view/dnd/set-drag-started') return;
        onDragStart(state.document, action);
    },
    'view/dnd/set-drag-ended': (state, action) => {
        if (action.type !== 'view/dnd/set-drag-ended') return;
        onDragEnd(state.document);
    },
    'view/update-active-branch?source=document': (state, action, context) => {
        if (action.type !== 'view/update-active-branch?source=document') return;
        updateActiveBranch(state.document, context.columns, true);
    },
    'view/set-active-node/history/select-next': (state, action) => {
        if (action.type !== 'view/set-active-node/history/select-next') return;
        navigateActiveNodeHistory(state.document, state, true);
    },
    'view/set-active-node/history/select-previous': (state, action) => {
        if (action.type !== 'view/set-active-node/history/select-previous') return;
        navigateActiveNodeHistory(state.document, state);
    },
    'view/set-active-node/keyboard-jump': (state, action, context) => {
        if (action.type !== 'view/set-active-node/keyboard-jump') return;
        jumpToNode(state.document, state, action, context.columns);
    },
    'view/active-node-history/delete-obsolete': (state, action) => {
        if (action.type !== 'view/active-node-history/delete-obsolete') return;
        removeDeletedNavigationItems(state, action.payload.content);
    },
    'view/search/toggle-fuzzy-mode': (state, action) => {
        if (action.type !== 'view/search/toggle-fuzzy-mode') return;
        toggleFuzzySearch(state);
    },
    'view/selection/clear-selection': (state, action) => {
        if (action.type !== 'view/selection/clear-selection') return;
        resetSelectionState(state.document);
    },
    'view/selection/select-all': (state, action, context) => {
        if (action.type !== 'view/selection/select-all') return;
        selectAllNodes(state.document, context.columns);
    },
    'view/set-active-node/sequential/select-next': (state, action) => {
        if (action.type !== 'view/set-active-node/sequential/select-next') return;
        navigateActiveNode(state.document, state, action);
    },
    'view/pinned-nodes/set-active-node': (state, action) => {
        if (action.type !== 'view/pinned-nodes/set-active-node') return;
        setActivePinnedNode(state.document, state.pinnedNodes, action.payload.id);
    },
    'view/recent-nodes/set-active-node': (state, action) => {
        if (action.type !== 'view/recent-nodes/set-active-node') return;
        setActiveRecentNode(state.document, state.recentNodes, action.payload.id);
    },
    'search/view/toggle-show-all-nodes': (state, action) => {
        if (action.type !== 'search/view/toggle-show-all-nodes') return;
        toggleShowAllNodes(state);
    },
    'view/style-rules/toggle-modal': (state, action) => {
        if (action.type !== 'view/style-rules/toggle-modal') return;
        const showStyleRulesModal = state.ui.controls.showStyleRulesModal;
        state.ui.controls = {
            showHistorySidebar: false,
            showStyleRulesModal: !showStyleRulesModal,
            showSettingsSidebar: false,
            showHelpSidebar: false,
        };
    },
    'view/style-rules/update-results': (state, action) => {
        if (action.type !== 'view/style-rules/update-results') return;
        if (!action.payload.results) {
            state.styleRules.nodeStyles = new Map();
            state.styleRules.allMatches = new Map();
            return;
        }
        state.styleRules.nodeStyles = action.payload.results.nodeStyles;
        state.styleRules.allMatches = action.payload.results.allMatches;
    },
    'view/keyboard/shift/up': (state, action) => {
        if (action.type !== 'view/keyboard/shift/up') return;
        state.keyboard.shift = false;
        state.keyboard = { ...state.keyboard };
    },
    'view/keyboard/shift/down': (state, action) => {
        if (action.type !== 'view/keyboard/shift/down') return;
        state.keyboard.shift = true;
        state.keyboard = { ...state.keyboard };
    },
    'view/hotkeys/set-search-term': (state, action) => {
        if (action.type !== 'view/hotkeys/set-search-term') return;
        state.hotkeys.searchTerm = action.payload.searchTerm.toLowerCase();
    },
    'view/hotkeys/update-conflicts': (state, action) => {
        if (action.type !== 'view/hotkeys/update-conflicts') return;
        state.hotkeys.conflictingHotkeys = action.payload.conflicts;
    },
    'view/outline/toggle-collapse-node': (state, action, context) => {
        if (action.type !== 'view/outline/toggle-collapse-node') return;
        toggleCollapseNode(state, context.columns, action.payload.id);
    },
    'view/outline/refresh-collapsed-nodes': (state, action, context) => {
        if (action.type !== 'view/outline/refresh-collapsed-nodes') return;
        refreshCollapsedNodes(state, context.columns);
    },
    'view/outline/toggle-collapse-all': (state, action, context) => {
        if (action.type !== 'view/outline/toggle-collapse-all') return;
        toggleCollapseAllNodes(state, context.columns);
    },
    'view/selection/set-selection': (state, action) => {
        if (action.type !== 'view/selection/set-selection') return;
        state.document.selectedNodes = new Set(action.payload.ids);
    },
    'view/mandala/subgrid/enter': (state, action) => {
        if (action.type !== 'view/mandala/subgrid/enter') return;
        state.ui.mandala.subgridTheme = action.payload.theme;
        state.ui.mandala = { ...state.ui.mandala };
    },
    'view/mandala/subgrid/exit': (state, action) => {
        if (action.type !== 'view/mandala/subgrid/exit') return;
        state.ui.mandala.subgridTheme = '1';
        state.ui.mandala = { ...state.ui.mandala };
    },
    'view/mandala/active-cell/set': (state, action) => {
        if (action.type !== 'view/mandala/active-cell/set') return;
        state.ui.mandala.activeCell9x9 = action.payload.cell;
        state.ui.mandala = { ...state.ui.mandala };
    },
    'view/mandala/swap/start': (state, action) => {
        if (action.type !== 'view/mandala/swap/start') return;
        state.ui.mandala.swap = {
            active: true,
            sourceNodeId: action.payload.sourceNodeId,
            targetNodeIds: new Set(action.payload.targetNodeIds),
            animate: false,
        };
        state.ui.mandala = { ...state.ui.mandala };
    },
    'view/mandala/swap/animate': (state, action) => {
        if (action.type !== 'view/mandala/swap/animate') return;
        state.ui.mandala.swap = {
            ...state.ui.mandala.swap,
            animate: true,
        };
        state.ui.mandala = { ...state.ui.mandala };
    },
    'view/mandala/swap/cancel': (state, action) => {
        if (action.type !== 'view/mandala/swap/cancel') return;
        state.ui.mandala.swap = {
            active: false,
            sourceNodeId: null,
            targetNodeIds: new Set(),
            animate: false,
        };
        state.ui.mandala = { ...state.ui.mandala };
    },
    'view/outline/load-persisted-collapsed-parents': (state, action, context) => {
        if (action.type !== 'view/outline/load-persisted-collapsed-parents') return;
        for (const id of action.payload.collapsedIds) {
            collapseNode(state, context.columns, id);
        }
        expandParentsOfActiveNode(state, context.columns);
        state.outline = { ...state.outline };
    },
};

const updateDocumentState = (
    state: ViewState,
    action: ViewStoreAction,
    context: MandalaGridDocument,
) => {
    const activeNode = state.document.activeNode;
    const handler = handlers[action.type];
    if (handler) {
        handler(state, action, context);
    }

    if (activeNode !== state.document.activeNode) {
        updateActiveBranch(state.document, context.columns, false);
        expandParentsOfActiveNode(state, context.columns);
    }
};

export const viewReducer = (
    store: ViewState,
    action: ViewStoreAction,
    context: MandalaGridDocument,
): ViewState => {
    updateDocumentState(store, action, context);
    return store;
};
