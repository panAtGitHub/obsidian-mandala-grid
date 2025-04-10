import { LineageView } from 'src/view/view';
import { setActivePinnedNode } from 'src/stores/view/subscriptions/actions/set-active-pinned-node';

export const loadPinnedNodesToDocument = (view: LineageView) => {
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const settingsStore = view.plugin.settings;
    const settingsState = settingsStore.getValue();
    const persistedDocuments = settingsState.documents;
    const persistedDocument = persistedDocuments[view.file!.path];

    if (!persistedDocument?.pinnedSections) return;

    if (persistedDocument.pinnedSections.sections.length === 0) {
        const activeLeftSideTab = settingsState.view.leftSidebarActiveTab;
        const showLeftSidebarStore = settingsState.view.showLeftSidebar;
        if (showLeftSidebarStore && activeLeftSideTab === 'pinned-cards') {
            settingsStore.dispatch({ type: 'view/left-sidebar/toggle' });
        }
        return;
    }
    if (documentState.pinnedNodes.Ids.length === 0) {
        documentStore.dispatch({
            type: 'document/pinned-nodes/load-from-settings',
            payload: {
                sections: persistedDocument.pinnedSections.sections,
            },
        });
    }
    const activeSection = persistedDocument.pinnedSections.activeSection;
    if (activeSection) {
        const id = documentState.sections.section_id[activeSection];
        if (id) {
            setActivePinnedNode(view, id);
        }
    }
};
