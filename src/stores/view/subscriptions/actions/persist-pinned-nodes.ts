import { MandalaView } from 'src/view/view';
import { writePinnedToFrontmatter } from 'src/view/helpers/mandala/pinned-frontmatter';

export const persistPinnedNodes = (view: MandalaView) => {
    if (!view.file) return;
    const documentState = view.documentStore.getValue();
    const viewState = view.viewStore.getValue();
    const pinnedNodes = documentState.pinnedNodes;
    const sections = documentState.sections;
    const pinnedSections = pinnedNodes.Ids
        .map((id) => sections.id_section[id])
        .filter((section): section is string => Boolean(section));
    const section = sections.id_section[viewState.pinnedNodes.activeNode];
    writePinnedToFrontmatter(view, pinnedSections);
    view.plugin.settings.dispatch({
        type: 'settings/pinned-nodes/persist',
        payload: {
            filePath: view.file.path,
            sections: pinnedSections,
            section: section || null,
        },
    });
};
