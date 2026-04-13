export type EditSessionCommitReason =
    | 'idle'
    | 'save'
    | 'blur'
    | 'switch-node'
    | 'unload'
    | 'disable-edit';

export type DraftProjectionSnapshot = {
    nodeId: string;
    content: string;
    revision: number;
};

export type EditSessionState = {
    activeNodeId: string | null;
    isInSidebar: boolean;
    bufferContent: string;
    projectionContent: string;
    dirty: boolean;
    projectionRevision: number;
    commitRevision: number;
    lastCommittedContent: string;
};

export type EditSessionCommitPayload = {
    nodeId: string;
    content: string;
    isInSidebar: boolean;
    reason: EditSessionCommitReason;
};
