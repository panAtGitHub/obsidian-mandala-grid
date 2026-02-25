import { Column } from 'src/stores/document/document-state-type';
import { findNodeColumn } from 'src/lib/tree-utils/find/find-node-column';

export const isNodeAlive = (columns: Column[], nodeId: string) => {
    if (!nodeId) return false;
    return findNodeColumn(columns, nodeId) >= 0;
};

export const getFirstNodeId = (columns: Column[]) => {
    return columns[0]?.groups[0]?.nodes[0] ?? '';
};

export const resolveSafeActiveNode = (
    columns: Column[],
    preferredNodeId: string,
    currentNodeId = '',
) => {
    if (isNodeAlive(columns, preferredNodeId)) return preferredNodeId;
    if (isNodeAlive(columns, currentNodeId)) return currentNodeId;
    return getFirstNodeId(columns);
};
