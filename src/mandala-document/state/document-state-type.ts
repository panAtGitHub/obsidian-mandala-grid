import { UndoableAction } from 'src/mandala-document/state/document-store-actions';

export type ClipboardBranch = {
    sortedChildGroups: NodeGroup[][];
    content: Content;
    nodeId: string;
    mode: 'cut' | 'copy';
};

export type Sections = {
    section_id: Record<string, string>;
    id_section: Record<string, string>;
};
export type DocumentMeta = {
    /** nodes that are parents*/
    groupParentIds: Set<string>;
    /**
     * Mandala 模式：固定槽位（section=槽位ID），拖拽只能做 swap，不允许增删改结构。
     * V2 主路径下始终开启，不再依赖 frontmatter 标记。
     */
    isMandala: boolean;
    mandalaV2: {
        enabled: boolean;
        revision: number;
        contentRevision: number;
        rootGroupId: string | null;
        orderedSections: string[];
        lastMutation: {
            actionType: string;
            changedSections: string[];
            structural: boolean;
        } | null;
        parentToChildrenSlots: Record<string, Partial<Record<number, string>>>;
        subtreeNonEmptyCountBySection: Record<string, number>;
        loadMetrics: {
            bytes: number;
            sectionsCount: number;
            parseMs: number;
            buildMs: number;
        } | null;
    };
};
export type DocumentState = {
    document: MandalaGridDocument;
    sections: Sections;
    file: {
        // path: string | null;
        frontmatter: string;
    };
    meta: DocumentMeta;
    history: DocumentHistory;
    pinnedNodes: PinnedNodesState;
};

// document
export type MandalaGridDocument = {
    columns: Column[];
    content: Content;
};

export type Column = {
    id: string;
    groups: NodeGroup[];
};

export type NodeGroup = {
    parentId: string;
    nodes: NodeId[];
};

export type NodeId = string;

export type Columns = Column[];
export type Content = {
    [nodeId: string]: {
        content: string;
    };
};

// document change history
export type DocumentHistory = History<Snapshot, { activeSection: string }>;

export type SnapshotContext = {
    affectedSection: string;
    newActiveSection: string;
    numberOfSections: number;
    action: UndoableAction;
    contentOfAffectedSection: string;
    numberOfCharacters: number;
    affectedSections?: string[];
};

export type Snapshot = {
    data: {
        content: string;
        columns: string;
    };
    context: SnapshotContext;
    created: number;
    id: string;
};

// navigation history
export type NavigationHistory = History<NodeId>;

export type HistoryState = {
    activeIndex: number;
    canGoBack: boolean;
    canGoForward: boolean;
};

export type History<T, U = undefined> = {
    items: T[];
    state: HistoryState;
    context: U;
};

export type PinnedNodesState = {
    Ids: string[];
};
