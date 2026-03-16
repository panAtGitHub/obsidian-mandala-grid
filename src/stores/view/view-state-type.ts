import {
    ActiveBranch,
    DNDState,
    EditingState,
} from 'src/stores/view/default-view-state';
import { ConflictingHotkeys } from 'src/obsidian/helpers/get-used-hotkeys';
import { NodeSearchResult } from 'src/stores/view/subscriptions/effects/document-search/document-search';

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
    dnd: DNDState;
    activeNode: string;
    activeNodesOfColumn: ActiveNodesOfColumn;
    selectedNodes: Set<string>;
    pendingConfirmation: PendingDocumentConfirmation;
};
export type PinnedNodes = {
    activeNode: string;
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
            subgridTheme: string | null;
            activeCell9x9: { row: number; col: number } | null;
            activeCellNx9: { row: number; col: number } | null;
            activeCellWeek7x9: { row: number; col: number } | null;
            weekAnchorDate: string | null;
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
