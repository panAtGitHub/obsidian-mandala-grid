import { MandalaView } from 'src/view/view';
import { MandalaViewDocumentPreferences } from 'src/stores/settings/settings-type';
import {
    parsePinnedSectionsFromPersistedState,
    parseSectionColorsFromPersistedState,
} from 'src/view/helpers/mandala/section-colors';

const getCurrentFilePath = (view: MandalaView) => view.file?.path ?? null;

export const getCurrentFileMandalaViewPreferences = (
    view: MandalaView,
): MandalaViewDocumentPreferences | null => {
    const path = getCurrentFilePath(view);
    if (!path) return null;
    return view.plugin.settings.getValue().documents[path]?.mandalaView ?? null;
};

export const getCurrentFilePinnedSections = (view: MandalaView) =>
    parsePinnedSectionsFromPersistedState(
        getCurrentFileMandalaViewPreferences(view)?.pinnedSections,
    );

export const getCurrentFileSectionColorsSource = (view: MandalaView) =>
    getCurrentFileMandalaViewPreferences(view)?.sectionColors ?? null;

export const getCurrentFileSectionColorMap = (view: MandalaView) =>
    parseSectionColorsFromPersistedState(getCurrentFileSectionColorsSource(view));
