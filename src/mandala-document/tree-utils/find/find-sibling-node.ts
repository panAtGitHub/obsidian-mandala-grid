import { Column, NodeId } from 'src/mandala-document/state/document-state-type';
import { VerticalDirection } from 'src/mandala-document/state/document-store-actions';
import { findSiblingNodeInGroup } from 'src/mandala-document/tree-utils/find/find-sibling-node-in-group';

export const findSiblingNode = (
    columns: Column[],
    node: NodeId,
    direction: VerticalDirection | 'right',
) => {
    return findSiblingNodeInGroup(
        columns,
        node,
        direction === 'right' ? 'up' : direction,
    );
};
