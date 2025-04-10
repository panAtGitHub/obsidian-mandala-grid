import { LineageView } from 'src/view/view';

export const loadCollapsedSectionsFromSettings = (view: LineageView) => {
    const settings = view.plugin.settings.getValue();
    const path = view.file!.path;
    const collapsedSections =
        settings.documents[path]?.outline?.collapsedSections;
    if (!collapsedSections) return;
    const viewStore = view.viewStore;
    const documentState = view.documentStore.getValue();
    const collapsedIds = collapsedSections
        .map((section) => {
            return documentState.sections.section_id[section];
        })
        .filter((x) => x);

    if (collapsedIds.length > 0) {
        viewStore.dispatch({
            type: 'view/outline/load-persisted-collapsed-parents',
            payload: {
                collapsedIds,
            },
        });
    }
};
