import { Column, NodeId } from 'src/mandala-document/state/document-state-type';
import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import { findGroupByNodeId } from 'src/mandala-document/tree-utils/find/find-group-by-node-id';
import { findSiblingNode } from 'src/mandala-document/tree-utils/find/find-sibling-node';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';

export const findAdjacentNode = (
    columns: Column[],
    nodeToMove: string,
    direction: AllDirections,
) => {
    let targetNode: NodeId | null = null;
    if (direction === 'left') {
        const group = findGroupByNodeId(columns, nodeToMove);
        if (group && !group.parentId.startsWith('r'))
            targetNode = group.parentId;
    } else {
        targetNode = findSiblingNode(columns, nodeToMove, direction);
    }

    // if first node of column is trying to move right, move it under the node below
    if (!targetNode && direction === 'right') {
        const columnIndex = findNodeColumn(columns, nodeToMove);
        const isFirstNodeOfColumn =
            columns[columnIndex].groups[0]?.nodes[0] === nodeToMove;
        if (isFirstNodeOfColumn) {
            targetNode = findSiblingNode(columns, nodeToMove, 'down');
        }
    }
    return targetNode;
};
