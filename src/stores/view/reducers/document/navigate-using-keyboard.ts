import { Column } from 'src/stores/document/document-state-type';
import { AllDirections } from 'src/stores/document/document-store-actions';
import { updateActiveNode } from 'src/stores/view/reducers/document/helpers/update-active-node';
import { findNextActiveNodeOnKeyboardNavigation } from 'src/lib/tree-utils/find/find-next-active-node-on-keyboard-navigation';
import { DocumentViewState, ViewState } from 'src/stores/view/view-state-type';
import { updateSelectionState } from 'src/stores/view/reducers/document/helpers/update-selection-state';

export type ChangeActiveNodeAction = {
    type: 'view/set-active-node/keyboard';
    payload: {
        direction: AllDirections;
    };
    context: {
        shiftKey?: boolean;
        outlineMode: boolean;
    };
};

export const navigateUsingKeyboard = (
    documentState: DocumentViewState,
    state: Pick<ViewState, 'navigationHistory' | 'outline'>,
    action: ChangeActiveNodeAction,
    columns: Column[],
) => {
    const nextNode = findNextActiveNodeOnKeyboardNavigation(
        columns,
        documentState.activeNode,
        action.payload.direction,
        documentState.activeNodesOfColumn,
        action.context.outlineMode ? state.outline.collapsedParents : null,
        action.context.shiftKey,
    );
    if (nextNode) {
        updateSelectionState(
            columns,
            documentState,
            nextNode,
            action.payload.direction === 'up' ||
                action.payload.direction === 'down',
            Boolean(action.context.shiftKey),
        );
        updateActiveNode(documentState, nextNode, state);
    }
};
