import { LineageDocument } from 'src/stores/document/document-state-type';
import invariant from 'tiny-invariant';
import { deleteChildNodes } from 'src/lib/tree-utils/delete/delete-child-nodes';
import { cleanAndSortColumns } from 'src/lib/tree-utils/sort/clean-and-sort-columns';

export type ExtractNodeAction = {
    type: 'document/extract-node';
    payload: {
        nodeId: string;
        documentName: string;
    };
};
export const removeExtractedBranch = (
    document: LineageDocument,
    action: Pick<ExtractNodeAction, 'payload'>,
) => {
    invariant(action.payload.nodeId);
    invariant(action.payload.documentName);
    deleteChildNodes(document, action.payload.nodeId);
    cleanAndSortColumns(document);
};
