import { ViewState } from 'src/stores/view/view-state-type';

export type ToggleShowAllNodesAction = {
    type: 'search/view/toggle-show-all-nodes';
};

export const toggleShowAllNodes = (state: ViewState) => {
    state.search.showAllNodes = !state.search.showAllNodes;
    state.search = { ...state.search };
};
