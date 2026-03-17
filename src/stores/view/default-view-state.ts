import { ViewState } from 'src/stores/view/view-state-type';
import { MandalaMode } from 'src/stores/settings/settings-type';

export const defaultViewState = (
    mandalaMode: MandalaMode = '3x3',
): ViewState => ({
    search: {
        query: '',
        results: new Map(),
        searching: false,
        showInput: false,
        fuzzySearch: true,
        showAllNodes: true,
    },
    ui: {
        controls: {
            showHelpSidebar: false,
            showSettingsSidebar: false,
        },
        previewDialog: {
            open: false,
            nodeId: null,
        },
        mandala: {
            mode: mandalaMode,
            subgridTheme: '1',
            activeCell9x9: null,
            activeCellNx9: null,
            activeCellWeek7x9: null,
            weekAnchorDate: null,
            swap: {
                active: false,
                sourceNodeId: null,
                targetNodeIds: new Set<string>(),
                animate: false,
            },
        },
    },
    document: {
        editing: {
            activeNodeId: '',
            isInSidebar: false,
        },
        activeBranch: {
            group: '',
            childGroups: new Set<string>(),
            sortedParentNodes: [],
            column: '',
            node: '',
        },
        dnd: {
            node: '',
            childGroups: new Set<string>(),
        },
        activeNode: '',
        activeNodesOfColumn: {},
        selectedNodes: new Set<string>(),
        pendingConfirmation: {
            disableEdit: null,
            deleteNode: new Set<string>(),
        },
    },
    pinnedNodes: {
        activeNode: '',
    },
    keyboard: {
        shift: false,
    },
    hotkeys: {
        searchTerm: '',
        conflictingHotkeys: new Map(),
    },
});
export type ActiveBranch = {
    childGroups: Set<string>;
    sortedParentNodes: string[];
    group: string;
    column: string;
    node: string;
};
export type DNDState = {
    childGroups: Set<string>;
    node: string;
};
export type EditingState = {
    activeNodeId: string;
    isInSidebar: boolean;
};
