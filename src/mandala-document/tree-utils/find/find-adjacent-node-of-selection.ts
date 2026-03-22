import { MandalaGridDocument } from 'src/mandala-document/state/document-state-type';
import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import { clone } from 'src/helpers/clone';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';
import invariant from 'tiny-invariant';
import { findAdjacentNode } from 'src/mandala-document/tree-utils/find/find-adjacent-node';

export const findAdjacentNodeOfSelection = (
    document: Pick<MandalaGridDocument, 'columns'>,
    activeNodeId: string,
    selectedNodes: Set<string>,
    direction: AllDirections,
) => {
    const searchColumns = clone(document.columns);
    // remove selected items from their column
    if (selectedNodes && selectedNodes.size > 1) {
        const column =
            searchColumns[findNodeColumn(searchColumns, activeNodeId)];
        invariant(column);
        for (const group of column.groups) {
            group.nodes = group.nodes.filter(
                (n) => n === activeNodeId || !selectedNodes?.has(n),
            );
        }
    }
    return findAdjacentNode(searchColumns, activeNodeId, direction);
};
