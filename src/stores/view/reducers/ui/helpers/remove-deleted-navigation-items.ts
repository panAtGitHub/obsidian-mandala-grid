import { Content } from 'src/stores/document/document-state-type';
import { ViewState } from 'src/stores/view/view-state-type';

export type RemoveObsoleteNavigationItemsAction = {
    type: 'view/active-node-history/delete-obsolete';
    payload: {
        content: Content;
    };
};
export const removeDeletedNavigationItems = (
    _state: Pick<ViewState, 'navigationHistory'>,
    _content: Content,
) => {
    // Navigation history is intentionally disabled in Mandala-specialized mode.
};
