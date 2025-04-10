import { Column } from 'src/stores/document/document-state-type';
import { updateActiveNode } from 'src/stores/view/reducers/document/helpers/update-active-node';
import { findNodeToJumpTo } from 'src/lib/tree-utils/find/find-node-to-jump-to';
import { DocumentViewState, ViewState } from 'src/stores/view/view-state-type';
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
    state: Pick<ViewState, 'navigationHistory'>,
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
        updateActiveNode(documentViewState, nextNode, state);
    }
};
