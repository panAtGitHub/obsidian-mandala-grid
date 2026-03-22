import { findNodeColumn } from '../find/find-node-column';
import { MandalaGridDocument } from 'src/mandala-document/state/document-state-type';
import { id } from 'src/helpers/id';
import { sortGroups } from 'src/mandala-document/tree-utils/sort/sort-groups';

export const insertChild = (
    document: Pick<MandalaGridDocument, 'columns'>,
    nodeIdOfParent: string,
    newNodeId: string,
    insertChildAtTheStart: boolean,
) => {
    const parentColumnIndex = findNodeColumn(document.columns, nodeIdOfParent);
    if (parentColumnIndex === -1) {
        throw new Error('could not find parent column');
    }
    const childColumnIndex = parentColumnIndex + 1;

    const childColumn = document.columns[childColumnIndex];
    if (childColumn) {
        const childGroup = childColumn.groups.find(
            (g) => g.parentId === nodeIdOfParent,
        );
        if (childGroup) {
            if (insertChildAtTheStart) {
                childGroup.nodes = [newNodeId, ...childGroup.nodes];
            } else {
                childGroup.nodes = [...childGroup.nodes, newNodeId];
            }
        } else {
            childColumn.groups.push({
                nodes: [newNodeId],
                parentId: nodeIdOfParent,
            });
            childColumn.groups = [...childColumn.groups];
        }
        childColumn.groups = sortGroups(
            document.columns[parentColumnIndex].groups,
            childColumn.groups,
        );
    } else {
        document.columns.push({
            id: id.column(),
            groups: [
                {
                    nodes: [newNodeId],
                    parentId: nodeIdOfParent,
                },
            ],
        });
        document.columns = [...document.columns];
    }
};
