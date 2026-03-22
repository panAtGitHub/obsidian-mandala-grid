import { Column, NodeId } from 'src/mandala-document/state/document-state-type';
import { VerticalDirection } from 'src/mandala-document/state/document-store-actions';
import { findGroupByNodeId } from 'src/mandala-document/tree-utils/find/find-group-by-node-id';
import invariant from 'tiny-invariant';

export const findSiblingNodeInGroup = (
    columns: Column[],
    node: NodeId,
    direction: VerticalDirection,
) => {
    const group = findGroupByNodeId(columns, node);
    invariant(group);
    const nodeIndex = group.nodes.findIndex((n) => n === node);
    return group.nodes[nodeIndex + (direction === 'up' ? -1 : 1)];
};
