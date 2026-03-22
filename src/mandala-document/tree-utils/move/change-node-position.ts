import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import { moveNodeAsChild } from 'src/mandala-document/tree-utils/move/move-node-as-child';
import { moveNodeAsSibling } from 'src/mandala-document/tree-utils/move/move-node-as-sibling';
import { moveChildGroupsNextToTheirParent } from 'src/mandala-document/tree-utils/move/move-child-groups-next-to-their-parent';
import {
    MandalaGridDocument,
    NodeId,
} from 'src/mandala-document/state/document-state-type';
import { findGroupByNodeId } from 'src/mandala-document/tree-utils/find/find-group-by-node-id';
import invariant from 'tiny-invariant';
import { deleteNodeById } from 'src/mandala-document/tree-utils/delete/delete-node-by-id';

export const changeNodePosition = (
    document: Pick<MandalaGridDocument, 'columns'>,
    node: NodeId,
    targetNode: NodeId,
    direction: AllDirections,
    type: 'move' | 'drop',
    moveChildToTheStart: boolean,
) => {
    const group = findGroupByNodeId(document.columns, node);
    invariant(group);
    deleteNodeById(document.columns, null, node);
    if (direction === 'right') {
        moveNodeAsChild(document, node, targetNode, moveChildToTheStart);
    } else {
        moveNodeAsSibling(
            document.columns,
            direction,
            node,
            targetNode,
            type === 'move' && direction !== 'left' ? group : undefined,
        );
    }
    moveChildGroupsNextToTheirParent(document, node);
};
