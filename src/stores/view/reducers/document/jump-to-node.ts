import { Column } from 'src/mandala-document/state/document-state-type';
import { updateActiveNode } from 'src/stores/view/reducers/document/helpers/update-active-node';
import { findNodeToJumpTo } from 'src/mandala-document/tree-utils/find/find-node-to-jump-to';
import { DocumentViewState } from 'src/stores/view/view-state-type';
import { updateSelectionState } from 'src/stores/view/reducers/document/helpers/update-selection-state';

export type JumpTarget =
    | 'start-of-group'
    | 'end-of-group'
    | 'start-of-column'
    | 'end-of-column';
export type JumpToNodeAction = {
    type: 'view/set-active-node/keyboard-jump';
    payload: {
        target: JumpTarget;
    };
    context?: {
        shiftKey: boolean;
    };
};

export const jumpToNode = (
    documentViewState: DocumentViewState,
    action: JumpToNodeAction,
    columns: Column[],
) => {
    const nextNode = findNodeToJumpTo(
        columns,
        documentViewState.activeNode,
        action.payload.target,
    );
    if (nextNode) {
        updateSelectionState(
            columns,
            documentViewState,
            nextNode,
            true,
            Boolean(action.context?.shiftKey),
        );
        updateActiveNode(documentViewState, nextNode, columns);
    }
};
