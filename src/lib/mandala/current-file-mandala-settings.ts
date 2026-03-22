import { MandalaView } from 'src/view/view';
import { MandalaViewDocumentPreferences } from 'src/mandala-settings/state/settings-type';
import {
    parsePinnedSectionsFromPersistedState,
    parseSectionColorsFromPersistedState,
} from 'src/lib/mandala/section-colors';

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
