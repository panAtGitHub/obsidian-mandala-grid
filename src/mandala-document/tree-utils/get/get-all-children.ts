import { Column } from 'src/mandala-document/state/document-state-type';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';

export const getAllChildren = (columns: Column[], nodeId: string): string[] => {
    const columnOfNode = findNodeColumn(columns, nodeId);
    const childGroups = new Set<string>([nodeId]);

    for (let i = columnOfNode + 1; i < columns.length; i++) {
        const column = columns[i];
        for (const group of column.groups) {
            if (childGroups.has(group.parentId)) {
                for (const childNodeId of group.nodes) {
                    childGroups.add(childNodeId);
                }
            }
        }
    }
    childGroups.delete(nodeId);
    return Array.from(childGroups);
};
