import { AllDirections } from 'src/stores/document/document-store-actions';
import { changeNodePosition } from 'src/lib/tree-utils/move/change-node-position';
import { findAdjacentNode } from 'src/lib/tree-utils/find/find-adjacent-node';
import { cleanAndSortColumns } from 'src/lib/tree-utils/sort/clean-and-sort-columns';
import invariant from 'tiny-invariant';
import { SilentError } from 'src/lib/errors/errors';
import { LineageDocument } from 'src/stores/document/document-state-type';
import { findAdjacentNodeOfSelection } from 'src/lib/tree-utils/find/find-adjacent-node-of-selection';
import { findAdjacentParent } from 'src/lib/tree-utils/find/find-adjacent-parent';

export type MoveNodeAction = {
    type: 'document/move-node';
    payload: {
        direction: AllDirections;
        activeNodeId: string;
        selectedNodes?: Set<string>;
    };
};

export const moveNode = (
    document: Pick<LineageDocument, 'columns'>,
    action: Pick<MoveNodeAction, 'payload'>,
) => {
    const selectedNodes = action.payload.selectedNodes;
    const isSelection = selectedNodes && selectedNodes.size > 1;
    const nodes = isSelection
        ? [...selectedNodes]
        : [action.payload.activeNodeId];

    let direction = action.payload.direction;

    const shouldReverseOrder =
        isSelection && (direction === 'down' || direction === 'left');
    if (shouldReverseOrder) nodes.reverse();
    invariant(action.payload.activeNodeId);

    let targetNode = isSelection
        ? findAdjacentNodeOfSelection(
              document,
              action.payload.activeNodeId,
              selectedNodes,
              direction,
          )
        : findAdjacentNode(
              document.columns,
              action.payload.activeNodeId,
              direction,
          );

    let moveNodeToTheStart = false;
    if (!targetNode && (direction === 'down' || direction === 'up')) {
        targetNode = findAdjacentParent(
            document.columns,
            action.payload.activeNodeId,
            direction,
        );
        moveNodeToTheStart = direction === 'down';
        direction = 'right';
    }

    if (!targetNode) throw new SilentError('could not find adjacent node');
    for (const nodeToMove of nodes) {
        changeNodePosition(
            document,
            nodeToMove,
            targetNode,
            direction,
            'move',
            moveNodeToTheStart,
        );
        cleanAndSortColumns(document);
    }
};
