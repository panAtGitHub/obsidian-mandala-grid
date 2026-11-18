export type EditSessionProjectionSnapshot = {
    nodeId: string;
    content: string;
    revision: number;
};

export type DraftProjectionSnapshot = EditSessionProjectionSnapshot;

export type EditSessionState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
    bufferContent: string;
    projectionContent: string;
    dirty: boolean;
    projectionRevision: number;
    lastCommittedContent: string;
};

export type EditSessionCommitPayload = {
    nodeId: string;
    content: string;
    previousContent: string;
    isInSidebar: boolean;
};
