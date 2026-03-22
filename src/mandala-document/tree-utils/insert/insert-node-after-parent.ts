import { MandalaGridDocument } from 'src/mandala-document/state/document-state-type';
import { findNodeColumnAndParent } from 'src/mandala-document/tree-utils/find/find-node-column-and-parent';
import { findGroupByNodeId } from 'src/mandala-document/tree-utils/find/find-group-by-node-id';
import { SilentError } from 'src/lib/errors/errors';

export const insertNodeAfterParent = (
    document: Pick<MandalaGridDocument, 'columns'>,
    nodeId: string,
    newNodeId: string,
) => {
    const column = findNodeColumnAndParent(document.columns, nodeId);
    if (!column) throw new Error('could not find parent column');
    if (column[0] === 0) {
        throw new SilentError(
            "can't create parent sibling for first column nodes",
        );
    }
    const parentId = column[1];

    const parentGroup = findGroupByNodeId(document.columns, parentId);

    if (!parentGroup) throw new Error('could not find group of parent node');

    parentGroup.nodes = parentGroup.nodes.reduce((nodes, nodeId) => {
        nodes.push(nodeId);
        if (nodeId === parentId) {
            nodes.push(newNodeId);
        }
        return nodes;
    }, [] as string[]);
};
