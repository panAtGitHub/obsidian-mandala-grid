import { DocumentState } from 'src/stores/document/document-state-type';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';

export const isStructuralDocumentChange = (
    documentState: DocumentState,
    action: DocumentStoreAction,
) => {
    const type = getDocumentEventType(action.type);
    if (type.createOrDelete || type.dropOrMove || type.clipboard) {
        return true;
    }

    if (action.type !== 'document/mandala/swap') {
        return false;
    }

    const mutation = documentState.meta.mandalaV2.lastMutation;
    return mutation?.actionType === action.type && mutation.structural;
};
