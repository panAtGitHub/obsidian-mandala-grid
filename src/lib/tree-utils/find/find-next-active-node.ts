import { Column } from 'src/stores/document/document-state-type';
import { DeleteNodeAction } from 'src/stores/document/reducers/delete-node/delete-node';
import { findNextNodeAfterDeletion } from 'src/lib/tree-utils/find/find-next-node-after-deletion';
import { JumpToNodeAction } from 'src/stores/view/reducers/document/jump-to-node';
import { findNodeToJumpTo } from 'src/lib/tree-utils/find/find-node-to-jump-to';

export const findNextActiveNode = (
    columns: Column[],
    node: string,
    action: DeleteNodeAction | JumpToNodeAction,
) => {
    if (action.type === 'document/delete-node') {
        return findNextNodeAfterDeletion(columns, node);
    } else if (action.type === 'view/set-active-node/keyboard-jump') {
        return findNodeToJumpTo(columns, node, action.payload.target);
    }
};
