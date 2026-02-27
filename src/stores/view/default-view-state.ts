import { ViewState } from 'src/stores/view/view-state-type';

export const defaultViewState = (): ViewState => ({
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
        mandala: {
            subgridTheme: '1',
            activeCell9x9: null,
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
    styleRules: {
        nodeStyles: new Map(),
        allMatches: new Map(),
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
