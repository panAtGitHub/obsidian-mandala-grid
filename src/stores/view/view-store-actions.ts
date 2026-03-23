import { SetSearchQueryAction } from 'src/stores/view/reducers/search/set-search-query';
import { SetSearchResultsAction } from 'src/stores/view/reducers/search/set-search-results';
import { ToggleSearchInputAction } from 'src/stores/view/reducers/search/toggle-search-input';
import { UpdateActiveBranchAction } from 'src/stores/view/reducers/document/helpers/update-active-branch';
import { JumpToNodeAction } from 'src/stores/view/reducers/document/jump-to-node';
import { ChangeActiveNodeAction } from 'src/stores/view/reducers/document/navigate-using-keyboard';
import { ToggleFuzzySearchAction } from 'src/stores/view/reducers/search/toggle-fuzzy-search';
import { NodeNavigationAction } from 'src/stores/view/reducers/ui/navigate-active-node';
import { SetActivePinnedNodeAction } from 'src/stores/view/reducers/pinned-cards/set-active-pinned-node';
import { ToggleShowAllNodesAction } from 'src/stores/view/reducers/search/toggle-show-all-nodes';
import { LeftSidebarTab } from 'src/mandala-settings/state/settings-type';
import { ConflictingHotkeys } from 'src/obsidian/helpers/get-used-hotkeys';
import { SelectAllNodesAction } from 'src/stores/view/reducers/selection/select-all-nodes';
import { MandalaMode } from 'src/mandala-settings/state/settings-type';
import type { Nx9ActiveCell } from 'src/mandala-scenes/view-nx9/context';

export type MandalaActions =
    | {
          type: 'view/mandala/mode/set';
          payload: { mode: MandalaMode };
      }
    | {
          type: 'view/mandala/detail-sidebar/set';
          payload: { open: boolean };
      }
    | {
          type: 'view/mandala/subgrid/enter';
          payload: { theme: string };
      }
    | {
          type: 'view/mandala/subgrid/exit';
      }
    | {
          type: 'view/mandala/active-cell/set';
          payload: { cell: { row: number; col: number } | null };
      }
    | {
          type: 'view/mandala/week-active-cell/set';
          payload: { cell: { row: number; col: number } | null };
      }
    | {
          type: 'view/mandala/nx9-active-cell/set';
          payload: { cell: Nx9ActiveCell | null };
      }
    | {
          type: 'view/mandala/week-anchor-date/set';
          payload: { date: string | null };
      }
    | {
          type: 'view/mandala/swap/start';
          payload: { sourceNodeId: string; targetNodeIds: string[] };
      }
    | {
          type: 'view/mandala/swap/animate';
      }
    | {
          type: 'view/mandala/swap/cancel';
      };

export type ViewStoreAction =
    | SearchAction
    | ViewUIAction
    | ViewDocumentAction
    | PreviewDialogAction
    | NodeSelectionAction
    | SidebarActions
    | KeyboardEventAction
    | ViewHotkeysAction
    | SelectionActions
    | MandalaActions;

export type SearchAction =
    | SetSearchQueryAction
    | SetSearchResultsAction
    | ToggleSearchInputAction
    | ToggleFuzzySearchAction
    | ToggleShowAllNodesAction;

export type ViewUIAction =
    | ToggleHelpSidebarAction
    | ToggleSettingsSidebarAction
    | { type: 'view/close-modals'; payload?: { closeAllModals: boolean } };

export type PreviewDialogAction =
    | {
          type: 'view/preview-dialog/open';
          payload: { nodeId: string };
      }
    | {
          type: 'view/preview-dialog/close';
      };

export type ToggleEditModeAction = {
    type: 'view/editor/enable-main-editor';
    payload: {
        nodeId: string;
        isInSidebar?: boolean;
    };
};

export type DisableEditModeAction = {
    type: 'view/editor/disable-main-editor';
    context?: {
        modKey?: boolean;
    };
};

export type ViewDocumentAction =
    | DisableEditModeAction
    | ToggleEditModeAction
    | UpdateActiveBranchAction
    | {
          type: 'view/editor/disable/reset-confirmation';
      }
    | {
          type: 'view/delete-node/reset-confirmation';
      }
    | {
          type: 'view/delete-node/confirm';
          payload: {
              id: string;
              includeSelection?: boolean;
          };
      }
    | {
          type: 'view/editor/disable/confirm';
          payload: {
              id: string;
          };
      }
    | { type: 'view/selection/clear-selection' };
type ToggleHelpSidebarAction = {
    type: 'view/hotkeys/toggle-modal';
};
type ToggleSettingsSidebarAction = {
    type: 'view/settings/toggle-modal';
};
export type NavigationActiveNodeActionType =
    | 'core-jump'
    | '9x9-nav'
    | 'nx9-nav'
    | 'focus-section';

type SetActiveNodeSource =
    | 'mouse'
    | 'mouse-silent'
    | 'search'
    | 'document'
    | NavigationActiveNodeActionType;

type SetActiveNodeAction = {
    type: `view/set-active-node/${SetActiveNodeSource}`;
    payload: {
        id: string;
    };
};
export type NodeSelectionAction =
    | JumpToNodeAction
    | ChangeActiveNodeAction
    | SetActiveNodeAction
    | NodeNavigationAction
    | SelectAllNodesAction;

export type SidebarActions =
    | PinnedNodesActions
    | EnableEditInSidebar
    | DisableEditInSidebar;

export type PinnedNodesActions = SetActivePinnedNodeAction;

export type EnableEditInSidebar = {
    type: 'view/editor/enable-sidebar-editor';
    payload: {
        id: string;
    };
    context: {
        activeSidebarTab: LeftSidebarTab;
    };
};

export type DisableEditInSidebar = {
    type: 'view/editor/disable-sidebar-editor';
    context?: {
        modKey?: boolean;
    };
};

export type KeyboardEventAction =
    | {
          type: 'view/keyboard/shift/down';
      }
    | {
          type: 'view/keyboard/shift/up';
      };

export type ViewHotkeysAction =
    | SetSearchTermAction
    | UpdateConflictingHotkeysAction;
export type SetSearchTermAction = {
    type: 'view/hotkeys/set-search-term';
    payload: {
        searchTerm: string;
    };
};
export type UpdateConflictingHotkeysAction = {
    type: 'view/hotkeys/update-conflicts';
    payload: {
        conflicts: ConflictingHotkeys;
    };
};

export type SelectionActions = {
    type: 'view/selection/set-selection';
    payload: { ids: string[] };
};
