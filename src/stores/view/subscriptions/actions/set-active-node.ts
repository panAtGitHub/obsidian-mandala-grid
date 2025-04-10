import { LineageView } from 'src/view/view';
import { getIdOfSection } from 'src/stores/view/subscriptions/helpers/get-id-of-section';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { Snapshot } from 'src/stores/document/document-state-type';

export const setActiveNode = (
    view: LineageView,
    action: DocumentStoreAction,
) => {
    const documentState = view.documentStore.getValue();
    const viewState = view.viewStore.getValue();

    const activeNodeOfView = viewState.document.activeNode;
    const id_section = documentState.sections.id_section;
    const section_id = documentState.sections.section_id;
    const activeSectionOfView = id_section[activeNodeOfView];
    const activeNodeExists = !!activeSectionOfView;

    let newActiveSection = documentState.history.context.activeSection;
    let shouldSetActiveNode = true;

    if (activeNodeExists) {
        // keep the affected active section when undoing
        if (action.type === 'document/history/select-previous-snapshot') {
            const state = documentState.history.state;
            const previousSnapshot: Snapshot =
                documentState.history.items[state.activeIndex + 1];
            const affectedSection = previousSnapshot.context.affectedSection;
            if (section_id[affectedSection]) {
                newActiveSection = affectedSection;
            }
        }
        // active view of file should always update except for dnd events
        else if (
            view.isViewOfFile &&
            (action.type === 'document/drop-node' ||
                action.type === 'document/move-node')
        ) {
            shouldSetActiveNode = false;
        }
        // unless the active node does not exist, don't update other views
        else if (!view.isActive) {
            shouldSetActiveNode = false;
        }
    }

    if (shouldSetActiveNode) {
        view.viewStore.dispatch({
            type: 'view/set-active-node/document',
            payload: {
                id: getIdOfSection(documentState.sections, newActiveSection),
            },
        });
    }
};
