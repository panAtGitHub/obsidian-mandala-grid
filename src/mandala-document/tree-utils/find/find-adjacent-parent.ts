import { Column } from 'src/mandala-document/state/document-state-type';
import { VerticalDirection } from 'src/mandala-document/state/document-store-actions';
import { findNodeColumnAndParent } from 'src/mandala-document/tree-utils/find/find-node-column-and-parent';
import { findSiblingNode } from 'src/mandala-document/tree-utils/find/find-sibling-node';

export const findAdjacentParent = (
    columns: Column[],
    nodeToMove: string,
    direction: VerticalDirection,
) => {
    const [columnIndex, parentId] = findNodeColumnAndParent(
        columns,
        nodeToMove,
    )!;
    if (columnIndex > 0) {
        return findSiblingNode(columns, parentId, direction);
    }
    return null;
};
