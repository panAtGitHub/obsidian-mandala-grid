import { MandalaView } from 'src/view/view';
import {
    compareSectionIds,
} from 'src/view/helpers/mandala/section-colors';
import { getCurrentFilePinnedSections } from 'src/lib/mandala/current-file-mandala-settings';

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
    const persistedSections = getCurrentFilePinnedSections(view);
    if (sameSections(persistedSections, pinnedSections)) return;
    view.plugin.settings.dispatch({
        type: 'settings/documents/persist-mandala-pinned-sections',
        payload: {
            path: view.file.path,
            sections: pinnedSections,
        },
    });
};
