import { Column, DocumentMeta } from 'src/stores/document/document-state-type';

export type RefreshGroupParentIdsAction = {
    type: 'document/meta/refresh-group-parent-ids';
};
export const refreshGroupParentIds = (
    columns: Column[],
    meta: DocumentMeta,
) => {
    const groupParentIds = new Set<string>();

    for (const column of columns) {
        for (const group of column.groups) {
            groupParentIds.add(group.parentId);
        }
    }
    meta.groupParentIds = groupParentIds;
};
