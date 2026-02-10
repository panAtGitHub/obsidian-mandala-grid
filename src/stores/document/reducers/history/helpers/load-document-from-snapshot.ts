import {
    DocumentHistory,
    MandalaGridDocument,
    Snapshot,
} from 'src/stores/document/document-state-type';

export const loadDocumentFromSnapshot = (
    document: MandalaGridDocument,
    snapshot: Snapshot,
    history: DocumentHistory,
) => {
    history.context.activeSection = snapshot.context.newActiveSection;
    document.content = JSON.parse(snapshot.data.content) as MandalaGridDocument['content'];
    document.columns = JSON.parse(snapshot.data.columns) as MandalaGridDocument['columns'];
};
