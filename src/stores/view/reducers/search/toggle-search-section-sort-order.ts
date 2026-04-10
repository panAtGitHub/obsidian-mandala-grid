import type { ViewState } from 'src/stores/view/view-state-type';

export type ToggleSearchSectionSortOrderAction = {
    type: 'view/search/toggle-section-sort-order';
};

export const toggleSearchSectionSortOrder = (state: ViewState) => {
    state.search.sectionSortOrder =
        state.search.sectionSortOrder === 'asc' ? 'desc' : 'asc';
    state.search = { ...state.search };
};
