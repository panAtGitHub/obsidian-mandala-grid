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
import { jumpToNode } from 'src/stores/view/reducers/document/jump-to-node';

import { toggleFuzzySearch } from 'src/stores/view/reducers/search/toggle-fuzzy-search';
import { resetSelectionState } from 'src/stores/view/reducers/document/helpers/reset-selection-state';
import { navigateActiveNode } from 'src/stores/view/reducers/ui/navigate-active-node';
import { setActivePinnedNode } from 'src/stores/view/reducers/pinned-cards/set-active-pinned-node';
import { toggleShowAllNodes } from 'src/stores/view/reducers/search/toggle-show-all-nodes';
import { resetPendingConfirmation } from 'src/stores/view/reducers/document/reset-pending-confirmation';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';
import { selectAllNodes } from 'src/stores/view/reducers/selection/select-all-nodes';
import { Platform } from 'obsidian';

type ViewActionHandler = (
    state: ViewState,
    action: ViewStoreAction,
    context: MandalaGridDocument,
) => void;

const handlers: Record<string, ViewActionHandler> = {
    'view/set-active-node/mouse': (state, action, context) => {
        if (action.type !== 'view/set-active-node/mouse') return;
        updateActiveNode(state.document, action.payload.id, context.columns);
        if (!state.document.selectedNodes.has(state.document.activeNode)) {
            resetSelectionState(state.document);
        }
    },
    'view/set-active-node/mouse-silent': (state, action, context) => {
        if (action.type !== 'view/set-active-node/mouse-silent') return;
        updateActiveNode(state.document, action.payload.id, context.columns);
        if (!state.document.selectedNodes.has(state.document.activeNode)) {
            resetSelectionState(state.document);
        }
    },
    'view/set-active-node/document': (state, action, context) => {
        if (action.type !== 'view/set-active-node/document') return;
        updateActiveNode(state.document, action.payload.id, context.columns);
        if (!state.document.selectedNodes.has(state.document.activeNode)) {
            resetSelectionState(state.document);
        }
    },
    'view/set-active-node/search': (state, action, context) => {
        if (action.type !== 'view/set-active-node/search') return;
        updateActiveNode(state.document, action.payload.id, context.columns);
        if (!state.document.selectedNodes.has(state.document.activeNode)) {
            resetSelectionState(state.document);
        }
    },
    'view/set-active-node/keyboard': (state, action, context) => {
        if (action.type !== 'view/set-active-node/keyboard') return;
        navigateUsingKeyboard(state.document, action, context.columns);
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
    'view/hotkeys/toggle-modal': (state, action) => {
        if (action.type !== 'view/hotkeys/toggle-modal') return;
        const showHelpSidebar = state.ui.controls.showHelpSidebar;
        state.ui.controls = {
            showHelpSidebar: !showHelpSidebar,
            showSettingsSidebar: false,
        };
    },
    'view/settings/toggle-modal': (state, action) => {
        if (action.type !== 'view/settings/toggle-modal') return;
        const showSettingsSidebar = state.ui.controls.showSettingsSidebar;
        state.ui.controls = {
            showHelpSidebar: false,
            showSettingsSidebar: !showSettingsSidebar,
        };
    },
    'view/close-modals': (state, action) => {
        if (action.type !== 'view/close-modals') return;
        state.ui.controls = {
            showHelpSidebar: action.payload?.closeAllModals
                ? false
                : state.ui.controls.showHelpSidebar,
            showSettingsSidebar: false,
        };
    },
    'view/editor/enable-main-editor': (state, action, context) => {
        if (action.type !== 'view/editor/enable-main-editor') return;
        if (Platform.isMobile) return;
        if (state.document.activeNode !== action.payload.nodeId) {
            updateActiveNode(
                state.document,
                action.payload.nodeId,
                context.columns,
            );
        }
        enableEditMode(state.document, action.payload.nodeId, action.payload.isInSidebar);
    },
    'view/editor/enable-sidebar-editor': (state, action) => {
        if (action.type !== 'view/editor/enable-sidebar-editor') return;
        if (Platform.isMobile) return;
        if (action.context.activeSidebarTab === 'pinned-cards') {
            if (state.pinnedNodes.activeNode !== action.payload.id) {
                setActivePinnedNode(
                    state.document,
                    state.pinnedNodes,
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
    'view/set-active-node/keyboard-jump': (state, action, context) => {
        if (action.type !== 'view/set-active-node/keyboard-jump') return;
        jumpToNode(state.document, action, context.columns);
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
    'view/set-active-node/sequential/select-next': (state, action, context) => {
        if (action.type !== 'view/set-active-node/sequential/select-next') return;
        navigateActiveNode(state.document, action, context.columns);
    },
    'view/pinned-nodes/set-active-node': (state, action) => {
        if (action.type !== 'view/pinned-nodes/set-active-node') return;
        setActivePinnedNode(state.document, state.pinnedNodes, action.payload.id);
    },
    'search/view/toggle-show-all-nodes': (state, action) => {
        if (action.type !== 'search/view/toggle-show-all-nodes') return;
        toggleShowAllNodes(state);
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
