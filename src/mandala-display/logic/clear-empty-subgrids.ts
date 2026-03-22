import { isEmptyMandalaContent } from 'src/mandala-display/logic/is-empty-mandala-content';
import { compareSectionIds } from 'src/mandala-document/engine/section-utils';
import { getAllChildren } from 'src/mandala-document/tree-utils/get/get-all-children';
import {
    MandalaGridDocument,
    Sections,
} from 'src/mandala-document/state/document-state-type';

export type ClearEmptySubgridsPlan = {
    parentIds: string[];
    rootNodeIds: string[];
    rootSections: string[];
    nodesToRemove: string[];
};

export type MandalaSectionContentEntry = {
    sectionId: string;
    content: string;
};

const isDocumentNode = (document: MandalaGridDocument, nodeId: string) =>
    Boolean(document.content[nodeId]);

const isEmptyContent = (document: MandalaGridDocument, nodeId: string) => {
    const value = document.content[nodeId]?.content ?? '';
    return isEmptyMandalaContent(value);
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

export const collectTrailingEmptyCoreSections = (
    entries: MandalaSectionContentEntry[],
) => {
    const rootSections = entries
        .map((entry) => entry.sectionId)
        .filter((sectionId) => !sectionId.includes('.'))
        .sort(compareSectionIds);
    const subtreeHasContent = new Map<string, boolean>();

    for (const entry of entries) {
        const root = entry.sectionId.split('.')[0];
        if (!root) continue;
        const next =
            (subtreeHasContent.get(root) ?? false) ||
            !isEmptyMandalaContent(entry.content);
        subtreeHasContent.set(root, next);
    }

    const trailing: string[] = [];
    for (let i = rootSections.length - 1; i >= 0; i -= 1) {
        const rootSection = rootSections[i];
        if (rootSection === '1') break;
        if (subtreeHasContent.get(rootSection)) break;
        trailing.unshift(rootSection);
    }

    return trailing;
};

export const createClearEmptyMandalaSubgridsPlan = (
    document: MandalaGridDocument,
    sections: Sections,
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
        if (!isDocumentNode(document, parentId)) continue;
        const children = getDirectChildren(document, parentId);
        if (children.length === 0) continue;
        const allChildrenEmpty = children.every((childId) =>
            isSubtreeEmpty(document, childId),
        );
        if (!allChildrenEmpty) continue;
        candidates.push(parentId);
    }

    const candidateSet = new Set(candidates);
    const rawParents = candidates.filter((parentId) => {
        let current = parentOf.get(parentId);
        while (current) {
            if (candidateSet.has(current)) return false;
            current = parentOf.get(current);
        }
        return true;
    });

    const trailingRootSections = collectTrailingEmptyCoreSections(
        Object.entries(sections.section_id).map(([sectionId, nodeId]) => ({
            sectionId,
            content: document.content[nodeId]?.content ?? '',
        })),
    );
    const rootNodeIds = trailingRootSections
        .map((sectionId) => sections.section_id[sectionId])
        .filter((nodeId): nodeId is string => Boolean(nodeId));
    const rootNodeIdSet = new Set(rootNodeIds);
    const parents = rawParents.filter((parentId) => {
        let current: string | undefined = parentId;
        while (current) {
            if (rootNodeIdSet.has(current)) return false;
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
    for (const rootNodeId of rootNodeIds) {
        nodesToRemove.add(rootNodeId);
        const descendants = getAllChildren(document.columns, rootNodeId);
        for (const childId of descendants) {
            nodesToRemove.add(childId);
        }
    }

    return {
        parentIds: parents,
        rootNodeIds,
        rootSections: trailingRootSections,
        nodesToRemove: Array.from(nodesToRemove),
    };
};
