import { NodeId } from 'src/stores/document/document-state-type';
import { ViewState } from 'src/stores/view/view-state-type';

export const addNavigationHistoryItem = (
    _state: Pick<ViewState, 'navigationHistory'>,
    _nodeId: NodeId,
) => {
    // Navigation history is intentionally disabled in Mandala-specialized mode.
};
