import { MandalaView } from 'src/view/view';
import {
    compareSectionIds,
    parsePinnedSectionsFromFrontmatter,
} from 'src/view/helpers/mandala/section-colors';

const sameSections = (a: string[], b: string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

export const loadPinnedNodesToDocument = (view: MandalaView) => {
    if (!view.file) return;
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const pinnedSections = parsePinnedSectionsFromFrontmatter(
        documentState.file.frontmatter,
    );
    const currentPinnedSections = documentState.pinnedNodes.Ids
        .map((id) => documentState.sections.id_section[id])
        .filter((section): section is string => Boolean(section))
        .sort(compareSectionIds);
    const unchanged = sameSections(currentPinnedSections, pinnedSections);

    if (pinnedSections.length === 0) {
        if (unchanged) return;
        documentStore.dispatch({
            type: 'document/pinned-nodes/load-from-frontmatter',
            payload: {
                sections: [],
            },
        });
        return;
    }

    if (unchanged) return;
    documentStore.dispatch({
        type: 'document/pinned-nodes/load-from-frontmatter',
        payload: {
            sections: pinnedSections,
        },
    });
};
