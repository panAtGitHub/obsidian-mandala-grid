import { ViewState } from 'src/stores/view/view-state-type';
import { NodeSearchResult } from 'src/stores/view/subscriptions/effects/document-search/document-search';

export type SetSearchResultsAction = {
    type: 'view/search/set-results';
    payload: {
        results: Map<string, NodeSearchResult>;
    };
};

export const setSearchResults = (
    state: ViewState,
    results: Map<string, NodeSearchResult>,
) => {
    state.search.results = new Map(results);
    state.search.searching = false;
    state.search = { ...state.search };
};
