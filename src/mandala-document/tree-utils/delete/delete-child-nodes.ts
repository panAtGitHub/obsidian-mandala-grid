import { MandalaGridDocument } from 'src/mandala-document/state/document-state-type';
import { traverseDown } from 'src/mandala-document/tree-utils/get/traverse-down';
import { deleteGroupsByParentId } from 'src/mandala-document/tree-utils/delete/delete-groups-by-parent-id';

export const deleteChildNodes = (document: MandalaGridDocument, node: string) => {
    const childGroups = traverseDown(document.columns, node, false);
    if (childGroups.length > 0)
        deleteGroupsByParentId(
            document.columns,
            document.content,
            new Set(childGroups),
        );
};
