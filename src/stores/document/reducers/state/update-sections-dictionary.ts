import {
    calculateColumnTreeIndexes,
    calculateMandalaTreeIndexes,
} from 'src/stores/view/subscriptions/helpers/calculate-tree-index';
import { DocumentState } from 'src/stores/document/document-state-type';

export const updateSectionsDictionary = (state: DocumentState) => {
    state.sections = state.meta.isMandala
        ? calculateMandalaTreeIndexes(state.document.columns)
        : calculateColumnTreeIndexes(state.document.columns);
};
