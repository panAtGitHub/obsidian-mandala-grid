import { MandalaView } from 'src/view/view';
import { maybeGetIdOfSection } from 'src/stores/view/subscriptions/helpers/maybe-get-id-of-section';

export const setInitialActiveNode = (view: MandalaView) => {
    if (view.getInitialBootstrapTarget()) return;

    let id: string | null = null;
    const viewStore = view.viewStore;
    const documentState = view.documentStore.getValue();
    const settings = view.plugin.settings.getValue();
    const path = view.file!.path;
    const persistedSection = settings.documents[path]?.activeSection;
    if (persistedSection) {
        id = maybeGetIdOfSection(documentState.sections, persistedSection);
    }
    const mostRecentActiveSection = documentState.history.context.activeSection;
    if (!id && mostRecentActiveSection) {
        id = maybeGetIdOfSection(
            documentState.sections,
            mostRecentActiveSection,
        );
    }
    if (!id) return;
    viewStore.setContext(documentState.document);
    viewStore.dispatch({
        type: 'view/set-active-node/document',
        payload: {
            id,
        },
    });
};
