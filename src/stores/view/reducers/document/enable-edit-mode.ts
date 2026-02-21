import { DocumentViewState } from 'src/stores/view/view-state-type';
import { resetPendingConfirmation } from 'src/stores/view/reducers/document/reset-pending-confirmation';

export const enableEditMode = (
    state: Pick<DocumentViewState, 'editing' | 'pendingConfirmation'>,
    nodeId: string,
    isInSidebar = false,
) => {
    if (state.editing.activeNodeId) {
        if (state.editing.activeNodeId === nodeId) {
            return;
        }
    }
    state.editing = {
        activeNodeId: nodeId,
        isInSidebar: isInSidebar,
    };
    resetPendingConfirmation(state);
};
