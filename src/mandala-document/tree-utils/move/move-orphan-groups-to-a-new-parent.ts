import {
    MandalaGridDocument,
    NodeId,
} from 'src/mandala-document/state/document-state-type';
import { findNodeColumn } from 'src/mandala-document/tree-utils/find/find-node-column';
import { id } from 'src/shared/helpers/id';
import { VerticalDirection } from 'src/mandala-document/state/document-store-actions';
import { findGroupByParentId } from 'src/mandala-document/tree-utils/find/find-group-by-node-id';

export const moveOrphanGroupsToANewParent = (
    document: Pick<MandalaGridDocument, 'columns'>,
    currentParentNode: NodeId,
    newParentNode: NodeId,
    direction: VerticalDirection,
) => {
    const groupOfMergedNode = findGroupByParentId(
        document.columns,
        currentParentNode,
    );
    if (!groupOfMergedNode) return;
    // remove from current column
    groupOfMergedNode.column.groups = groupOfMergedNode.column.groups.filter(
        (g) => g.parentId !== groupOfMergedNode.group.parentId,
    );
    // insert child groups into their new columns
    const parentColumnIndex = findNodeColumn(document.columns, newParentNode);

    const targetColumnIndex = parentColumnIndex + 1;
    const existingGroupOfNewParent = findGroupByParentId(
        document.columns,
        newParentNode,
    );

    if (existingGroupOfNewParent) {
        if (direction === 'up')
            existingGroupOfNewParent.group.nodes = [
                ...existingGroupOfNewParent.group.nodes,
                ...groupOfMergedNode.group.nodes,
            ];
        else {
            existingGroupOfNewParent.group.nodes = [
                ...groupOfMergedNode.group.nodes,
                ...existingGroupOfNewParent.group.nodes,
            ];
        }
    } else {
        if (!document.columns[targetColumnIndex]) {
            document.columns.push({
                id: id.column(),
                groups: [],
            });
            document.columns = [...document.columns];
        }
        groupOfMergedNode.group.parentId = newParentNode;
        document.columns[targetColumnIndex].groups.push(
            groupOfMergedNode.group,
        );
        document.columns[targetColumnIndex].groups = [
            ...document.columns[targetColumnIndex].groups,
        ];
    }
};
