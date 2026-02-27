import { MandalaView } from 'src/view/view';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';

export const setActiveNode = (
    view: MandalaView,
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
        // active view of file should always update except for dnd events
        if (
            view.isViewOfFile &&
            action.type === 'document/mandala/swap'
        ) {
            shouldSetActiveNode = false;
        }
        // unless the active node does not exist, don't update other views
        else if (!view.isActive) {
            shouldSetActiveNode = false;
        }
    }

    if (shouldSetActiveNode) {
        const nextId =
            section_id[newActiveSection] ||
            (activeSectionOfView ? section_id[activeSectionOfView] : '') ||
            documentState.document.columns[0]?.groups[0]?.nodes[0];
        if (!nextId) return;
        view.viewStore.dispatch({
            type: 'view/set-active-node/document',
            payload: {
                id: nextId,
            },
        });
    }
};
