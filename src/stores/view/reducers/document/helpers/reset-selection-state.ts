import { DocumentViewState } from 'src/stores/view/view-state-type';
import { assignSelectedNodes } from 'src/stores/view/reducers/document/helpers/assign-selected-nodes';

export const resetSelectionState = (documentState: DocumentViewState) => {
    assignSelectedNodes(documentState, new Set());
};
