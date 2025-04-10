import { ViewState } from 'src/stores/view/view-state-type';

export type SetSearchQueryAction = {
    type: 'view/search/set-query';
    payload: {
        query: string;
    };
};

export const setSearchQuery = (state: ViewState, query: string) => {
    state.search.query = query;
    if (!query) state.search.results = new Map();
    state.search.searching = query.length > 0;
    state.search = { ...state.search };
};
