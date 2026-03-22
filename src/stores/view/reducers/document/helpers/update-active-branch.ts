import { Column } from 'src/mandala-document/state/document-state-type';
import { traverseUp } from 'src/mandala-document/tree-utils/get/traverse-up';
import { traverseDown } from 'src/mandala-document/tree-utils/get/traverse-down';
import { findGroupByNodeId } from 'src/mandala-document/tree-utils/find/find-group-by-node-id';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';
import { DocumentViewState } from 'src/stores/view/view-state-type';
import { removeStaleActiveNodes } from 'src/stores/view/reducers/document/helpers/remove-stale-active-nodes';
import { compareActiveBranch } from 'src/stores/view/reducers/document/helpers/compare-active-branch';
import { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import { ViewStoreAction } from 'src/stores/view/view-store-actions';

export type UpdateActiveBranchAction =
    | {
          type: 'view/update-active-branch?source=view';
          context: {
              columns: Column[];
              viewAction: ViewStoreAction;
          };
      }
    | {
          type: 'view/update-active-branch?source=document';
          context: {
              documentAction: DocumentStoreAction;
          };
      };

export type ActiveBranch = {
    childGroups: Set<string>;
    sortedParentNodes: string[];
    group: string;
    column: string;
    node: string;
};

const createEmptyActiveBranch = (): ActiveBranch => ({
    childGroups: new Set<string>(),
    sortedParentNodes: [],
    group: '',
    column: '',
    node: '',
});

export const updateActiveBranch = (
    state: Pick<
        DocumentViewState,
        'activeBranch' | 'activeNode' | 'activeNodesOfColumn'
    >,
    columns: Column[],
    isDocumentAction: boolean,
) => {
    if (!state.activeNode) return;
    const nodeColumnIndex = findNodeColumn(columns, state.activeNode);
    const group = findGroupByNodeId(columns, state.activeNode);
    if (!group || nodeColumnIndex < 0) {
        state.activeBranch = createEmptyActiveBranch();
        if (isDocumentAction) {
            state.activeNodesOfColumn = removeStaleActiveNodes(
                columns,
                state.activeNodesOfColumn,
            );
        }
        return;
    }

    const sortedParents = traverseUp(columns, state.activeNode).reverse();
    const childGroups = traverseDown(columns, state.activeNode, true);
    const columnId = columns[nodeColumnIndex].id;

    const newActiveBranch = {
        childGroups: new Set<string>(childGroups),
        sortedParentNodes: sortedParents,
        group: group.parentId,
        column: columnId,
        node: state.activeNode,
    };
    const same = compareActiveBranch(state.activeBranch, newActiveBranch);
    if (!same) {
        state.activeBranch = newActiveBranch;
    }
    if (!state.activeNodesOfColumn[columnId])
        state.activeNodesOfColumn[columnId] = {};
    state.activeNodesOfColumn[columnId][group.parentId] = state.activeNode;

    if (isDocumentAction) {
        state.activeNodesOfColumn = removeStaleActiveNodes(
            columns,
            state.activeNodesOfColumn,
        );
    }
};
