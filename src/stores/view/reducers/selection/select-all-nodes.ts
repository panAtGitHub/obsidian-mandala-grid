import { Column } from 'src/mandala-document/state/document-state-type';
import { DocumentViewState } from 'src/stores/view/view-state-type';
import { findGroupByNodeId } from 'src/mandala-document/tree-utils/find/find-group-by-node-id';
import invariant from 'tiny-invariant';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';
import { resolveSafeActiveNode } from 'src/stores/view/reducers/document/helpers/active-node-safety';
import { assignSelectedNodes } from 'src/stores/view/reducers/document/helpers/assign-selected-nodes';

export type SelectAllNodesAction = {
    type: 'view/selection/select-all';
};

const compareSetToArray = (set: Set<string>, array: string[]) => {
    return set.size === array.length && array.every((node) => set.has(node));
};

export const selectAllNodes = (state: DocumentViewState, columns: Column[]) => {
    if (columns.length === 0 || columns[0].groups.length === 0) return;
    const firstColumnNodes = columns[0].groups[0].nodes;
    const safeActiveNode = resolveSafeActiveNode(
        columns,
        state.activeNode,
        state.activeBranch.node,
    );
    if (!safeActiveNode) return;
    state.activeNode = safeActiveNode;
    const rootColumnIsSelected = compareSetToArray(
        state.selectedNodes,
        firstColumnNodes,
    );

    if (rootColumnIsSelected) {
        return;
    }

    const column = columns[findNodeColumn(columns, safeActiveNode)];
    invariant(column);
    const nodeColumnNodes = column.groups.flatMap((g) => g.nodes);
    const columnIsSelected = compareSetToArray(
        state.selectedNodes,
        nodeColumnNodes,
    );
    if (columnIsSelected) {
        assignSelectedNodes(state, new Set(firstColumnNodes));
        state.activeNode = state.activeBranch.sortedParentNodes[0];
        return;
    }

    const nodeGroup = findGroupByNodeId(columns, safeActiveNode);
    invariant(nodeGroup);
    const groupIsSelected = compareSetToArray(
        state.selectedNodes,
        nodeGroup.nodes,
    );
    if (groupIsSelected) {
        assignSelectedNodes(state, new Set(nodeColumnNodes));
        return;
    }

    assignSelectedNodes(state, new Set(nodeGroup.nodes));
};
