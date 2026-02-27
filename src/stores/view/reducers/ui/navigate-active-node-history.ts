import { Column } from 'src/stores/document/document-state-type';
import { DocumentViewState, ViewState } from 'src/stores/view/view-state-type';

import { RemoveObsoleteNavigationItemsAction } from 'src/stores/view/reducers/ui/helpers/remove-deleted-navigation-items';

export type NodeHistoryNavigationAction =
    | {
          type:
              | 'view/set-active-node/history/select-previous'
              | 'view/set-active-node/history/select-next';
      }
    | RemoveObsoleteNavigationItemsAction;

export const navigateActiveNodeHistory = (
    _documentState: DocumentViewState,
    _state: Pick<ViewState, 'navigationHistory' | 'recentNodes'>,
    _columns: Column[],
    _forward = false,
) => {
    // Navigation history is intentionally disabled in Mandala-specialized mode.
};
