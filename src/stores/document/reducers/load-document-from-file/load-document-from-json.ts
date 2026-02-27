import {
    DocumentState,
    MandalaGridDocument,
} from 'src/stores/document/document-state-type';
import invariant from 'tiny-invariant';

export const loadDocumentFromJSON = (
    state: DocumentState,
    document: MandalaGridDocument,
) => {
    state.document.columns = document.columns;
    state.document.content = document.content;
    state.meta.mandalaV2 = {
        ...state.meta.mandalaV2,
        enabled: false,
        subtreeNonEmptyCountBySection: {},
        loadMetrics: null,
    };

    const activeNode = state.document.columns[0].groups[0].nodes[0];
    invariant(activeNode);

    return activeNode;
};
