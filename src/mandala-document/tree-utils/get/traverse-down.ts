import { Column, NodeId } from 'src/mandala-document/state/document-state-type';
import { findNodeColumn } from '../find/find-node-column';

export const traverseDown = (
    columns: Column[],
    nodeId: NodeId,
    /* false during document operations that change the structure */
    cleanDocument: boolean,
): NodeId[] => {
    const result: string[] = [];
    let nodeColumnIndex = 0;
    if (cleanDocument) {
        nodeColumnIndex = findNodeColumn(columns, nodeId) + 1;
        if (nodeColumnIndex > columns.length - 1) {
            return result;
        }
    }

    const currentParents = new Set([nodeId]);

    let firstResult = false;

    for (let i = nodeColumnIndex; i < columns.length; i++) {
        const column = columns[i];
        let columnResult = false;
        for (const group of column.groups) {
            if (currentParents.has(group.parentId)) {
                result.push(group.parentId);
                group.nodes.forEach((node) => currentParents.add(node));
                columnResult = true;
                if (!firstResult) firstResult = true;
            }
        }
        if (firstResult && !columnResult) break;
    }

    return result;
};
