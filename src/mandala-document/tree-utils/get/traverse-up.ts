import { Column } from 'src/mandala-document/state/document-state-type';
import { findNodeColumnAndParent } from 'src/mandala-document/tree-utils/find/find-node-column-and-parent';

export const traverseUp = (columns: Column[], nodeId: string): string[] => {
    const parentIds: string[] = [];

    const columnAndParent = findNodeColumnAndParent(columns, nodeId);
    if (!columnAndParent) return parentIds;

    let currentParentId: string | undefined = columnAndParent[1];

    const nodeColumnIndex = columnAndParent[0];
    for (let i = nodeColumnIndex - 1; i >= 0; i--) {
        if (!currentParentId) break;

        parentIds.push(currentParentId);

        let nextParentId: string | undefined;
        for (const group of columns[i].groups) {
            for (const node of group.nodes) {
                if (node === currentParentId) {
                    nextParentId = group.parentId;
                    break;
                }
            }
            if (nextParentId) break;
        }
        currentParentId = nextParentId;
    }

    return parentIds;
};
