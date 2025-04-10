import { LineageView } from 'src/view/view';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { getIdOfSection } from 'src/stores/view/subscriptions/helpers/get-id-of-section';
import { clearSelectedNodes } from 'src/stores/view/subscriptions/actions/clear-selected-nodes';

export const updateSelectedNodes = (
    view: LineageView,
    action: DocumentStoreAction,
    changeHistory: boolean,
) => {
    const documentState = view.documentStore.getValue();
    let clear = true;
    if (action.type === 'document/paste-node' || changeHistory) {
        const history = documentState.history;
        const snapshot = history.items[history.state.activeIndex];
        if (snapshot.context.affectedSections) {
            clear = false;
            const ids = snapshot.context.affectedSections.map((section) =>
                getIdOfSection(documentState.sections, section),
            );
            view.viewStore.dispatch({
                type: 'view/selection/set-selection',
                payload: {
                    ids: ids,
                },
            });
        }
    }
    if (clear) {
        clearSelectedNodes(view);
    }
};
