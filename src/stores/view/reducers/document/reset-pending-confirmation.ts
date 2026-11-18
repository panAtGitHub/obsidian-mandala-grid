import { DocumentViewState } from 'src/stores/view/view-state-type';

export const resetPendingConfirmation = (
    state: Pick<DocumentViewState, 'pendingConfirmation'>,
) => {
    state.pendingConfirmation = {
        deleteNode: new Set(),
    };
};
