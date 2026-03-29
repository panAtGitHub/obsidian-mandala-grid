import { buildSetStamp } from 'src/shared/helpers/build-set-stamp';
import type { DocumentViewState } from 'src/stores/view/view-state-type';

export const assignSelectedNodes = (
    documentState: DocumentViewState,
    selectedNodes: Set<string>,
) => {
    documentState.selectedNodes = selectedNodes;
    documentState.selectedNodesStamp = buildSetStamp(selectedNodes);
};
