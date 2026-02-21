import { MandalaView } from 'src/view/view';
import {
    compareSectionIds,
    parsePinnedSectionsFromPersistedState,
} from 'src/view/helpers/mandala/section-colors';

const sameSections = (a: string[], b: string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

export const persistPinnedNodes = (view: MandalaView) => {
    if (!view.file) return;
    const documentState = view.documentStore.getValue();
    const pinnedNodes = documentState.pinnedNodes;
    const sections = documentState.sections;
    const pinnedSections = pinnedNodes.Ids
        .map((id) => sections.id_section[id])
        .filter((section): section is string => Boolean(section))
        .sort(compareSectionIds);
    const persistedMandalaView =
        view.plugin.settings.getValue().documents[view.file.path]?.mandalaView;
    const persistedSections = parsePinnedSectionsFromPersistedState(
        persistedMandalaView?.pinnedSections,
    );
    if (sameSections(persistedSections, pinnedSections)) return;
    view.plugin.settings.dispatch({
        type: 'settings/documents/persist-mandala-pinned-sections',
        payload: {
            path: view.file.path,
            sections: pinnedSections,
        },
    });
};
