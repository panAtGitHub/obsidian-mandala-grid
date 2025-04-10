import { updateNavigationState } from 'src/stores/document/reducers/history/helpers/update-navigation-state';
import {
    DocumentHistory,
    LineageDocument,
} from 'src/stores/document/document-state-type';
import { loadDocumentFromSnapshot } from 'src/stores/document/reducers/history/helpers/load-document-from-snapshot';

export type UndoRedoAction = {
    type:
        | 'document/history/select-previous-snapshot'
        | 'document/history/select-next-snapshot';
};

export const undoAction = (
    document: LineageDocument,
    history: DocumentHistory,
) => {
    const currentIndex = history.state.activeIndex;

    const newIndex = currentIndex - 1;
    const snapshot = history.items[newIndex];
    if (!snapshot) return;

    history.state.activeIndex = newIndex;
    updateNavigationState(history);
    loadDocumentFromSnapshot(document, snapshot, history);
};
