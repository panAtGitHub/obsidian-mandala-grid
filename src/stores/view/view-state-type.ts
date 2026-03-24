import {
    ActiveBranch,
    EditingState,
} from 'src/stores/view/default-view-state';
import { ConflictingHotkeys } from 'src/obsidian/helpers/get-used-hotkeys';
import { NodeSearchResult } from 'src/stores/view/subscriptions/effects/document-search/document-search';
import { MandalaMode } from 'src/mandala-settings/state/settings-type';
import type { Nx9ActiveCell } from 'src/mandala-scenes/view-nx9/context';

export type ActiveNodesOfColumn = {
    [columnId: string]: {
        [groupId: string]: string;
    };
};

export type PendingDocumentConfirmation = {
    disableEdit: string | null;
    deleteNode: Set<string>;
};

export type DocumentViewState = {
    editing: EditingState;
    activeBranch: ActiveBranch;
    activeNode: string;
    activeNodesOfColumn: ActiveNodesOfColumn;
    selectedNodes: Set<string>;
    pendingConfirmation: PendingDocumentConfirmation;
};
export type PinnedNodes = {
    activeNode: string;
};
export type FocusTarget =
    | {
          kind: 'node';
          nodeId: string;
      }
    | {
          kind: 'cell';
          scene: '9x9' | 'nx9' | 'week-7x9';
          row: number;
          col: number;
          page?: number;
      };
export type ViewState = {
    search: {
        query: string;
        results: Map<string, NodeSearchResult>;
        searching: boolean;
        showInput: boolean;
        fuzzySearch: boolean;
        showAllNodes: boolean;
    };
    ui: {
        controls: {
            showHelpSidebar: boolean;
            showSettingsSidebar: boolean;
        };
        previewDialog: {
            open: boolean;
            nodeId: string | null;
        };
        mandala: {
            mode: MandalaMode;
            focusTarget: FocusTarget | null;
            showDetailSidebar: boolean;
            subgridTheme: string | null;
            activeCell9x9: { row: number; col: number } | null;
            activeCellNx9: Nx9ActiveCell | null;
            sceneState: {
                nx9: {
                    weekPlan: {
                        activeCell: { row: number; col: number } | null;
                        anchorDate: string | null;
                    };
                };
            };
            swap: {
                active: boolean;
                sourceNodeId: string | null;
                targetNodeIds: Set<string>;
                animate: boolean;
            };
        };
    };
    document: DocumentViewState;
    pinnedNodes: PinnedNodes;
    keyboard: {
        shift: boolean;
    };
    hotkeys: {
        searchTerm: string;
        conflictingHotkeys: ConflictingHotkeys;
    };
};
