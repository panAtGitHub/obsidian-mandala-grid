import { updateActiveNode } from 'src/stores/view/reducers/document/helpers/update-active-node';
import { DocumentViewState } from 'src/stores/view/view-state-type';
import { Column, Sections } from 'src/stores/document/document-state-type';
import { findNextNode } from 'src/lib/tree-utils/find/find-next-node';
import { resetSelectionState } from 'src/stores/view/reducers/document/helpers/reset-selection-state';

export type NodeNavigationAction = {
    type: 'view/set-active-node/sequential/select-next';
    payload: {
        sections: Sections;
        direction: 'back' | 'forward';
    };
};

export const navigateActiveNode = (
    documentState: DocumentViewState,
    action: NodeNavigationAction,
    columns: Column[],
) => {
    const nextNode = findNextNode(
        action.payload.sections,
        documentState.activeNode,
        action.payload.direction,
        null,
    );
    if (nextNode && nextNode !== documentState.activeNode) {
        updateActiveNode(documentState, nextNode, columns);
        resetSelectionState(documentState);
    }
};
