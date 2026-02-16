import { MandalaView } from 'src/view/view';
import { readPinnedFromFrontmatter } from 'src/view/helpers/mandala/pinned-frontmatter';

export const loadPinnedNodesToDocument = (view: MandalaView) => {
    if (!view.file) return;
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const settingsState = view.plugin.settings.getValue();
    const persistedFrontmatter = readPinnedFromFrontmatter(view);
    const pinnedSections = persistedFrontmatter?.sections ?? null;

    if (!pinnedSections) return;

    if (pinnedSections.length === 0) {
        const activeLeftSideTab = settingsState.view.leftSidebarActiveTab;
        const showLeftSidebarStore = settingsState.view.showLeftSidebar;
        if (showLeftSidebarStore && activeLeftSideTab === 'pinned-cards') {
            view.plugin.settings.dispatch({ type: 'view/left-sidebar/toggle' });
        }
        return;
    }

    documentStore.dispatch({
        type: 'document/pinned-nodes/load-from-settings',
        payload: {
            sections: pinnedSections,
        },
    });
};
