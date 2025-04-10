import { ViewState } from 'src/stores/view/view-state-type';

export type ToggleFuzzySearchAction = {
    type: 'view/search/toggle-fuzzy-mode';
};

export const toggleFuzzySearch = (state: ViewState) => {
    state.search.fuzzySearch = !state.search.fuzzySearch;
    state.search = { ...state.search };
};
