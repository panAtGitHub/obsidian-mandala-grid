import { DocumentState } from 'src/stores/document/document-state-type';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
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
