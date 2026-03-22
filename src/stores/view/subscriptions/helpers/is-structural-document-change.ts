import { DocumentState } from 'src/mandala-document/state/document-state-type';
import { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';

export const isStructuralDocumentChange = (
    documentState: DocumentState,
    action: DocumentStoreAction,
) => {
    const type = getDocumentEventType(action, documentState);
    return Boolean(
        type.structural ||
            type.createOrDelete ||
            type.dropOrMove ||
            type.clipboard,
    );
};
