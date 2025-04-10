import { ViewState } from 'src/stores/view/view-state-type';
import { setSearchQuery } from 'src/stores/view/reducers/search/set-search-query';

export type ToggleSearchInputAction = {
    type: 'view/search/toggle-input';
};

export const toggleSearchInput = (state: ViewState) => {
    state.search.showInput = !state.search.showInput;
    if (!state.search.showInput) {
        setSearchQuery(state, '');
    }
    state.search = { ...state.search };
};
