import { Content, NodeId } from 'src/stores/document/document-state-type';
import { updateNavigationState } from 'src/stores/document/reducers/history/helpers/update-navigation-state';
import { ViewState } from 'src/stores/view/view-state-type';

export type RemoveObsoleteNavigationItemsAction = {
    type: 'view/active-node-history/delete-obsolete';
    payload: {
        content: Content;
    };
};
export const removeDeletedNavigationItems = (
    state: Pick<ViewState, 'navigationHistory'>,
    content: Content,
) => {
    const items: NodeId[] = [];
    let previous: NodeId | null = null;
    for (const item of state.navigationHistory.items) {
        if (content.hasOwnProperty(item) && item !== previous) {
            items.push(item);
            previous = item;
        }
    }

    state.navigationHistory.items = items;
    state.navigationHistory.state.activeIndex =
        state.navigationHistory.items.length - 1;
    updateNavigationState(state.navigationHistory);
    state.navigationHistory = {
        ...state.navigationHistory,
    };
};
