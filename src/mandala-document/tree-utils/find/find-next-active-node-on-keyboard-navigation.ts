import { Column, NodeId } from 'src/mandala-document/state/document-state-type';
import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';
import { findGroupByNodeId } from 'src/mandala-document/tree-utils/find/find-group-by-node-id';
import { findChildGroup } from 'src/mandala-document/tree-utils/find/find-child-group';
import { ActiveNodesOfColumn } from 'src/stores/view/view-state-type';

const filterHiddenGroups = (
    columns: Column[],
    collapsedParents: Set<string>,
) => {
    return columns.map((c) => {
        return {
            groups: c.groups.filter((g) => {
                return !collapsedParents.has(g.parentId);
            }),
            id: c.id,
        } as Column;
    });
};

export const findNextActiveNodeOnKeyboardNavigation = (
    columns: Column[],
    node: string,
    direction: AllDirections,
    activeNodeOfGroup: ActiveNodesOfColumn,
    collapsedParents: Set<string> | null,
    isSelecting = false,
) => {
    if (!node) return;
    let nextNode: NodeId | null = null;
    if (collapsedParents) {
        columns = filterHiddenGroups(columns, collapsedParents);
    }

    if (direction === 'left') {
        const group = findGroupByNodeId(columns, node);
        if (group && !group.parentId.startsWith('r')) nextNode = group.parentId;
    } else if (direction === 'right') {
        const group = findChildGroup(columns, node);
        if (group) {
            const columnIndex = findNodeColumn(columns, node);
            const nextColumn = columns[columnIndex + 1];
            if (!nextColumn) return;
            const activeNode =
                activeNodeOfGroup[nextColumn.id]?.[group.parentId];
            if (activeNode) nextNode = activeNode;
            else nextNode = group.nodes[0];
        }
        // commenting this because a childless node should not be able to navigate right
        /*else {
			const nextColumn = columns[columnIndex + 1];
			if (!nextColumn) return;
			nextNode = nextColumn.groups[0]?.nodes?.[0];
		}*/
    } else {
        const columnIndex = findNodeColumn(columns, node);
        const column = columns[columnIndex];
        if (!column) return;
        const outlineMode = Boolean(collapsedParents);
        const groupOfActiveNode = findGroupByNodeId(columns, node)!;
        const allNodes = outlineMode
            ? groupOfActiveNode.nodes
            : column.groups.map((g) => g.nodes).flat();
        const nodeIndex = allNodes.findIndex((n) => n === node);
        const parentId = columnIndex > 0 ? groupOfActiveNode.parentId : null;
        if (outlineMode) {
            if (direction === 'up') {
                if (nodeIndex > 0) {
                    nextNode = allNodes[nodeIndex - 1];
                } else if (nodeIndex === 0 && !isSelecting) {
                    /* in outline mode, select parent when moving up and active node index === 0 */
                    return parentId;
                }
            } else if (direction === 'down') {
                if (nodeIndex < allNodes.length - 1) {
                    nextNode = allNodes[nodeIndex + 1];
                } else if (
                    nodeIndex === allNodes.length - 1 &&
                    parentId &&
                    !isSelecting
                ) {
                    /* in outline mode, select next parent when moving up and active node index === length - 1 */
                    const groupOfParentNode = findGroupByNodeId(
                        columns,
                        parentId,
                    );
                    if (groupOfParentNode) {
                        const parentIndex = groupOfParentNode.nodes.findIndex(
                            (n) => n === parentId,
                        );
                        nextNode = groupOfParentNode.nodes[parentIndex + 1];
                    }
                }
            }
        } else {
            if (direction === 'up') {
                if (nodeIndex > 0) {
                    nextNode = allNodes[nodeIndex - 1];
                }
            } else if (direction === 'down') {
                if (nodeIndex < allNodes.length - 1) {
                    nextNode = allNodes[nodeIndex + 1];
                }
            }
        }
    }
    return nextNode;
};
