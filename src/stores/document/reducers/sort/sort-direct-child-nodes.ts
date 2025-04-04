import { LineageDocument } from 'src/stores/document/document-state-type';
import { findGroupByParentId } from 'src/lib/tree-utils/find/find-group-by-node-id';
import invariant from 'tiny-invariant';
import { cleanAndSortColumns } from 'src/lib/tree-utils/sort/clean-and-sort-columns';

export type SortChildNodesAction = {
    type: 'document/sort-direct-child-nodes';
    payload: {
        id: string;
        order: 'ascending' | 'descending';
    };
};

export const sortDirectChildNodes = (
    document: LineageDocument,
    payload: SortChildNodesAction['payload'],
) => {
    const group = findGroupByParentId(document.columns, payload.id);
    invariant(group);
    const copy = [...group.group.nodes];
    const sorted =
        payload.order === 'ascending'
            ? copy.sort((a, b) => {
                  const content_a = document.content[a].content;
                  const content_b = document.content[b].content;
                  return content_a.localeCompare(content_b, undefined, {
                      numeric: true,
                  });
              })
            : copy.sort((a, b) => {
                  const content_a = document.content[a].content;
                  const content_b = document.content[b].content;
                  return content_b.localeCompare(content_a, undefined, {
                      numeric: true,
                  });
              });

    group.group.nodes = sorted;
    cleanAndSortColumns(document);
};
