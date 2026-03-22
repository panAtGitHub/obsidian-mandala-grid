import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';
import { findChildGroup } from 'src/mandala-document/tree-utils/find/find-child-group';
import {
    Column,
    MandalaGridDocument,
    NodeId,
} from 'src/mandala-document/state/document-state-type';
import { createColumn } from 'src/mandala-document/tree-utils/create/create-column';
import { createGroup } from 'src/mandala-document/tree-utils/create/create-group';

export const moveNodeAsChild = (
    document: Pick<MandalaGridDocument, 'columns'>,
    node: NodeId,
    targetNode: NodeId,
    moveToTheStart: boolean,
) => {
    const targetGroup = findChildGroup(document.columns, targetNode);
    if (targetGroup) {
        if (moveToTheStart) {
            /* used when moving a node with no sibling down*/
            targetGroup.nodes = [node, ...targetGroup.nodes];
        } else {
            targetGroup.nodes = [...targetGroup.nodes, node];
        }
    } else {
        const currentColumnIndex = findNodeColumn(document.columns, targetNode);
        let targetColumn: Column | undefined;
        targetColumn = document.columns[currentColumnIndex + 1];

        if (!targetColumn) {
            const newColumn = createColumn();
            document.columns.push(newColumn);
            document.columns = [...document.columns];
            targetColumn = newColumn;
        }
        const newGroup = createGroup(targetNode);
        newGroup.nodes.push(node);
        targetColumn.groups.push(newGroup);
        targetColumn.groups = [...targetColumn.groups];
    }
};
