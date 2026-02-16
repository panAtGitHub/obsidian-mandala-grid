import { MandalaView } from 'src/view/view';
import { writePinnedSectionsToFrontmatter } from 'src/view/helpers/mandala/section-colors';

export const persistPinnedNodes = (view: MandalaView) => {
    if (!view.file) return;
    const documentState = view.documentStore.getValue();
    const pinnedNodes = documentState.pinnedNodes;
    const sections = documentState.sections;
    const pinnedSections = pinnedNodes.Ids
        .map((id) => sections.id_section[id])
        .filter((section): section is string => Boolean(section));
    void writePinnedSectionsToFrontmatter(view, pinnedSections);
};
