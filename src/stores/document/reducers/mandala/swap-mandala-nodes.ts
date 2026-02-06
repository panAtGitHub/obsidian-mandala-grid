import { id } from 'src/helpers/id';
import { SilentError } from 'src/lib/errors/errors';
import { findNodeColumn } from 'src/lib/tree-utils/find/find-node-column';
import { findNodePosition } from 'src/lib/tree-utils/find/find-node-position';
import { sortGroups } from 'src/lib/tree-utils/sort/sort-groups';
import { MandalaGridDocument } from 'src/stores/document/document-state-type';

export type MandalaSwapAction = {
    type: 'document/mandala/swap';
    payload: {
        sourceNodeId: string;
        targetNodeId: string;
    };
};

export const swapMandalaNodes = (
    document: Pick<MandalaGridDocument, 'columns'>,
    sourceNodeId: string,
    targetNodeId: string,
) => {
    if (sourceNodeId === targetNodeId) return;
    const a = findNodePosition(document.columns, sourceNodeId);
    const b = findNodePosition(document.columns, targetNodeId);
    if (!a || !b) throw new SilentError('could not find node position');

    const groupA = document.columns[a.columnIndex].groups[a.groupIndex];
    const groupB = document.columns[b.columnIndex].groups[b.groupIndex];

    groupA.nodes[a.nodeIndex] = targetNodeId;
    groupB.nodes[b.nodeIndex] = sourceNodeId;

    // ensure reactive updates
    groupA.nodes = [...groupA.nodes];
    if (groupB !== groupA) {
        groupB.nodes = [...groupB.nodes];
    }
};

export type MandalaEnsureChildrenAction = {
    type: 'document/mandala/ensure-children';
    payload: {
        parentNodeId: string;
        count?: number;
    };
};

export type MandalaEnsureCoreThemeAction = {
    type: 'document/mandala/ensure-core-theme';
    payload: {
        theme: string;
    };
};

export type MandalaClearEmptySubgridsAction = {
    type: 'document/mandala/clear-empty-subgrids';
    payload: {
        parentIds: string[];
        activeNodeId: string;
    };
};

export const ensureMandalaChildren = (
    document: MandalaGridDocument,
    parentNodeId: string,
    childCount = 8,
): string[] => {
    if (childCount <= 0) return [];

    const parentColumnIndex = findNodeColumn(document.columns, parentNodeId);
    if (parentColumnIndex === -1) {
        throw new SilentError('could not find parent column');
    }

    const childColumnIndex = parentColumnIndex + 1;

    const createNode = () => {
        const nodeId = id.node();
        document.content[nodeId] = { content: '' };
        return nodeId;
    };

    const createChildren = (count: number) =>
        Array.from({ length: count }, () => createNode());

    const childColumn = document.columns[childColumnIndex];
    if (!childColumn) {
        const nodes = createChildren(childCount);
        document.columns.push({
            id: id.column(),
            groups: [{ parentId: parentNodeId, nodes }],
        });
        document.columns = [...document.columns];
        return nodes;
    }

    const existingGroup = childColumn.groups.find(
        (group) => group.parentId === parentNodeId,
    );

    if (!existingGroup) {
        const nodes = createChildren(childCount);
        childColumn.groups.push({ parentId: parentNodeId, nodes });
        childColumn.groups = sortGroups(
            document.columns[parentColumnIndex].groups,
            childColumn.groups,
        );
        childColumn.groups = [...childColumn.groups];
        return nodes;
    }

    if (existingGroup.nodes.length >= childCount) return [];

    const missing = childCount - existingGroup.nodes.length;
    const nodes = createChildren(missing);
    existingGroup.nodes = [...existingGroup.nodes, ...nodes];
    childColumn.groups = [...childColumn.groups];
    return nodes;
};

export const ensureMandalaCoreTheme = (
    document: MandalaGridDocument,
    _theme: string,
): { nodeId: string; created: boolean } => {
    void _theme;
    const rootGroup = document.columns[0]?.groups?.[0];
    if (!rootGroup) {
        throw new SilentError('could not find root group');
    }

    const nodeId = id.node();
    rootGroup.nodes = [...rootGroup.nodes, nodeId];
    document.content[nodeId] = { content: '' };
    document.columns = [...document.columns];
    return { nodeId, created: true };
};
