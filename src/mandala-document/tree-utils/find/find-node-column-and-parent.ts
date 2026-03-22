import { Columns } from 'src/mandala-document/state/document-state-type';

export const findNodeColumnAndParent = (
    columns: Columns,
    nodeId: string,
): [column: number, parent: string] | null => {
    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        for (const group of column.groups) {
            for (const node of group.nodes) {
                if (node === nodeId) {
                    return [i, group.parentId];
                }
            }
        }
    }
    return null;
};
