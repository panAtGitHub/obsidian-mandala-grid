import { cleanAndSortColumns } from 'src/lib/tree-utils/sort/clean-and-sort-columns';
import { LineageDocument } from 'src/stores/document/document-state-type';
import { deleteChildNodes } from 'src/lib/tree-utils/delete/delete-child-nodes';
import { isLastRootNode } from 'src/lib/tree-utils/assert/is-last-root-node';
import invariant from 'tiny-invariant';
import { deleteNodeById } from 'src/lib/tree-utils/delete/delete-node-by-id';
import { insertFirstNode } from 'src/lib/tree-utils/insert/insert-first-node';
import { findNextNodeAfterDeletion } from 'src/lib/tree-utils/find/find-next-node-after-deletion';

export type DeleteNodeAction = {
    type: 'document/delete-node';
    payload: {
        activeNodeId: string;
        selectedNodes?: Set<string>;
    };
};

export const deleteNode = (
    document: LineageDocument,
    nodeId: string,
    selectedNodes?: Set<string>,
) => {
    invariant(nodeId);

    const isSelection = selectedNodes && selectedNodes.size > 0;
    const nodes: string[] = isSelection ? [...selectedNodes] : [nodeId];

    let nextNode: string | undefined = undefined;
    for (let i = 0; i < nodes.length; i++) {
        const nodeId = nodes[i];
        if (
            i === nodes.length - 1 &&
            !isLastRootNode(document.columns, nodeId)
        ) {
            nextNode = findNextNodeAfterDeletion(document.columns, nodeId);
        }
        deleteChildNodes(document, nodeId);
        deleteNodeById(document.columns, document.content, nodeId);
        cleanAndSortColumns(document);
    }
    if (!nextNode) {
        nextNode = insertFirstNode(document.columns, document.content);
    }
    invariant(nextNode);
    return nextNode;
};
