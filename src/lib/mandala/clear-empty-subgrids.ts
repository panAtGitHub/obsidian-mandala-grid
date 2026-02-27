import { getAllChildren } from 'src/lib/tree-utils/get/get-all-children';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';

export type ClearEmptySubgridsPlan = {
    parentIds: string[];
    nodesToRemove: string[];
};

const isEmptyContent = (document: MandalaGridDocument, nodeId: string) => {
    const value = document.content[nodeId]?.content ?? '';
    return value.length === 0;
};

const getDirectChildren = (document: MandalaGridDocument, parentId: string) => {
    for (const column of document.columns) {
        for (const group of column.groups) {
            if (group.parentId === parentId) {
                return group.nodes;
            }
        }
    }
    return [];
};

const isSubtreeEmpty = (document: MandalaGridDocument, nodeId: string) => {
    if (!isEmptyContent(document, nodeId)) return false;
    const descendants = getAllChildren(document.columns, nodeId);
    return descendants.every((descendantId) =>
        isEmptyContent(document, descendantId),
    );
};

export const createClearEmptyMandalaSubgridsPlan = (
    document: MandalaGridDocument,
): ClearEmptySubgridsPlan => {
    const parentsWithChildren = new Set<string>();
    const parentOf = new Map<string, string>();

    for (const column of document.columns) {
        for (const group of column.groups) {
            parentsWithChildren.add(group.parentId);
            for (const nodeId of group.nodes) {
                parentOf.set(nodeId, group.parentId);
            }
        }
    }

    const candidates: string[] = [];
    for (const parentId of parentsWithChildren) {
        const children = getDirectChildren(document, parentId);
        if (children.length === 0) continue;
        const allChildrenEmpty = children.every((childId) =>
            isSubtreeEmpty(document, childId),
        );
        if (!allChildrenEmpty) continue;
        candidates.push(parentId);
    }

    const candidateSet = new Set(candidates);
    const parents = candidates.filter((parentId) => {
        let current = parentOf.get(parentId);
        while (current) {
            if (candidateSet.has(current)) return false;
            current = parentOf.get(current);
        }
        return true;
    });

    const nodesToRemove = new Set<string>();
    for (const parentId of parents) {
        const children = getAllChildren(document.columns, parentId);
        for (const childId of children) {
            nodesToRemove.add(childId);
        }
    }

    return { parentIds: parents, nodesToRemove: Array.from(nodesToRemove) };
};
