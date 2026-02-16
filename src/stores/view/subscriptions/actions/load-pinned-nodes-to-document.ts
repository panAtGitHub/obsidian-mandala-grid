import { MandalaView } from 'src/view/view';
import { setActivePinnedNode } from 'src/stores/view/subscriptions/actions/set-active-pinned-node';
import { readPinnedFromFrontmatter } from 'src/view/helpers/mandala/pinned-frontmatter';

const getValidPinnedSections = (
    sections: string[] | null | undefined,
    sectionToNodeId: Record<string, string>,
) => {
    if (!sections) return [];
    return sections.filter((section) => Boolean(sectionToNodeId[section]));
};

export const loadPinnedNodesToDocument = (view: MandalaView) => {
    if (!view.file) return;
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const settingsStore = view.plugin.settings;
    const settingsState = settingsStore.getValue();
    const fromSettings = settingsState.documents[view.file.path]?.pinnedSections;
    const persistedFrontmatter = readPinnedFromFrontmatter(view);
    const sectionToNodeId = documentState.sections.section_id;

    const settingsSections = fromSettings?.sections ?? null;
    const frontmatterSections = persistedFrontmatter?.sections ?? null;
    const settingsValidSections = getValidPinnedSections(
        settingsSections,
        sectionToNodeId,
    );
    const frontmatterValidSections = getValidPinnedSections(
        frontmatterSections,
        sectionToNodeId,
    );

    const pinnedSections =
        settingsValidSections.length > 0
            ? settingsValidSections
            : frontmatterValidSections.length > 0
              ? frontmatterValidSections
              : settingsSections ?? frontmatterSections ?? null;
    const activeSection =
        fromSettings?.activeSection &&
        sectionToNodeId[fromSettings.activeSection]
            ? fromSettings.activeSection
            : null;

    if (!pinnedSections) return;

    if (pinnedSections.length === 0) {
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
                sections: pinnedSections,
            },
        });
    }

    if (
        frontmatterValidSections.length > 0 &&
        settingsValidSections.length === 0
    ) {
        settingsStore.dispatch({
            type: 'settings/pinned-nodes/persist',
            payload: {
                filePath: view.file.path,
                sections: frontmatterValidSections,
                section: activeSection,
            },
        });
    }

    if (activeSection) {
        const id = documentState.sections.section_id[activeSection];
        if (id) {
            setActivePinnedNode(view, id);
        }
    }
};
