import { Column } from 'src/mandala-document/state/document-state-type';
import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import { updateActiveNode } from 'src/stores/view/reducers/document/helpers/update-active-node';
import { findNextActiveNodeOnKeyboardNavigation } from 'src/mandala-document/tree-utils/find/find-next-active-node-on-keyboard-navigation';
import { DocumentViewState } from 'src/stores/view/view-state-type';
import { updateSelectionState } from 'src/stores/view/reducers/document/helpers/update-selection-state';

export type ChangeActiveNodeAction = {
    type: 'view/set-active-node/keyboard';
    payload: {
        direction: AllDirections;
    };
    context?: {
        shiftKey?: boolean;
    };
};

export const navigateUsingKeyboard = (
    documentState: DocumentViewState,
    action: ChangeActiveNodeAction,
    columns: Column[],
) => {
    const nextNode = findNextActiveNodeOnKeyboardNavigation(
        columns,
        documentState.activeNode,
        action.payload.direction,
        documentState.activeNodesOfColumn,
        null,
        action.context?.shiftKey,
    );
    if (nextNode) {
        updateSelectionState(
            columns,
            documentState,
            nextNode,
            action.payload.direction === 'up' ||
                action.payload.direction === 'down',
            Boolean(action.context?.shiftKey),
        );
        updateActiveNode(documentState, nextNode, columns);
    }
};
