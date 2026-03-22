import { Column } from 'src/mandala-document/state/document-state-type';

/** maps an array of columns into a single nodes array that is sorted logically (1, 1.1, 2 ...) */
export const sortTreeNodes = (columns: Column[]): string[] => {
    if (columns.length === 0) return [];
    const sortedNodes: string[] = [];
    const stack: { nodeId: string; columnIndex: number }[] = [];

    for (const group of columns[0].groups) {
        for (let i = group.nodes.length - 1; i >= 0; i--) {
            stack.push({ nodeId: group.nodes[i], columnIndex: 0 });
        }
    }

    while (stack.length > 0) {
        const item = stack.pop()!;
        sortedNodes.push(item.nodeId);

        if (item.columnIndex + 1 < columns.length) {
            const nextColumn = columns[item.columnIndex + 1];
            for (const group of nextColumn.groups) {
                if (group.parentId === item.nodeId) {
                    for (let i = group.nodes.length - 1; i >= 0; i--) {
                        stack.push({
                            nodeId: group.nodes[i],
                            columnIndex: item.columnIndex + 1,
                        });
                    }
                }
            }
        }
    }

    return sortedNodes;
};
