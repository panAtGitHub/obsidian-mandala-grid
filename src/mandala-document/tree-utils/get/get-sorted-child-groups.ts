import {
    Columns,
    NodeGroup,
    NodeId,
} from 'src/mandala-document/state/document-state-type';
import { traverseDown } from 'src/mandala-document/tree-utils/get/traverse-down';

export const getSortedChildGroups = (
    columns: Columns,
    currentParentNode: NodeId,
    remove = false,
) => {
    const childGroupsArray = traverseDown(columns, currentParentNode, false);

    const childGroups = new Set(childGroupsArray);
    const sortedChildGroups: NodeGroup[][] = [];

    for (const column of columns) {
        const childGroupsOfColumns: NodeGroup[] = [];
        const groups = [];
        for (const group of column.groups) {
            if (childGroups.has(group.parentId)) {
                childGroupsOfColumns.push(group);
            } else {
                groups.push(group);
            }
        }
        if (remove) column.groups = groups;
        if (childGroupsOfColumns.length > 0)
            sortedChildGroups.push(childGroupsOfColumns);
    }
    return sortedChildGroups;
};
