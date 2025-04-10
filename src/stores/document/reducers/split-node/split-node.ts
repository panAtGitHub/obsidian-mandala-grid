import { LineageDocument } from 'src/stores/document/document-state-type';
import { SilentError } from 'src/lib/errors/errors';
import { pasteNode } from 'src/stores/document/reducers/clipboard/paste-node/paste-node';
import { deleteNode } from 'src/stores/document/reducers/delete-node/delete-node';
import { findChildGroup } from 'src/lib/tree-utils/find/find-child-group';
import { lang } from 'src/lang/lang';
import { splitText } from 'src/stores/document/reducers/split-node/helpers/split-text';

export type SplitNodeMode = 'headings' | 'outline' | 'blocks';
export type SplitNodeAction = {
    type: 'document/split-node';
    payload: {
        target: string;
        mode: SplitNodeMode;
    };
};

export const splitNode = (
    document: LineageDocument,
    action: Pick<SplitNodeAction, 'payload'>,
) => {
    const targetNode = action.payload.target;
    const content = document.content[targetNode];
    if (!content?.content) throw new SilentError('empty node');
    const sections = splitText(content?.content, action.payload.mode);
    if (sections === content.content)
        throw new Error(lang.error_cm_cant_split_node_identical);
    const childGroup = findChildGroup(document.columns, targetNode);
    if (childGroup)
        throw new Error(lang.error_cm_cant_split_node_that_has_children);

    const result = pasteNode(document, {
        payload: {
            position: 'down',
            targetNodeId: targetNode,
            text: sections,
        },
    });
    deleteNode(document, targetNode);
    return result.nextNode;
};
