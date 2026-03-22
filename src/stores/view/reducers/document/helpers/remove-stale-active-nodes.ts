import { Column } from 'src/mandala-document/state/document-state-type';
import { ActiveNodesOfColumn } from 'src/stores/view/view-state-type';

export const removeStaleActiveNodes = (
    columns: Column[],
    activeNodes: ActiveNodesOfColumn,
): ActiveNodesOfColumn => {
    const result: ActiveNodesOfColumn = {};

    const columnMap = new Map<string, Column>();
    const groupMap = new Map<string, Set<string>>();
    const nodeMap = new Map<string, Set<string>>();

    for (const column of columns) {
        const groupSet = new Set<string>();
        columnMap.set(column.id, column);
        for (const group of column.groups) {
            groupSet.add(group.parentId);
            nodeMap.set(group.parentId, new Set(group.nodes));
        }
        groupMap.set(column.id, groupSet);
    }

    for (const [columnId, groupEntries] of Object.entries(activeNodes)) {
        if (!columnMap.has(columnId)) continue;

        const validGroups = groupMap.get(columnId)!;
        const cleanedGroups: { [groupId: string]: string } = {};

        // process each group in the column
        for (const [groupId, nodeId] of Object.entries(groupEntries)) {
            if (!validGroups.has(groupId)) continue;

            const validNodes = nodeMap.get(groupId);
            if (!validNodes?.has(nodeId)) continue;

            cleanedGroups[groupId] = nodeId;
        }

        // only add column if it has valid groups
        if (Object.keys(cleanedGroups).length > 0) {
            result[columnId] = cleanedGroups;
        }
    }
    return result;
};
