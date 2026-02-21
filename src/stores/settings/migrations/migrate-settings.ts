import { MandalaGridOrientation, Settings } from 'src/stores/settings/settings-type';
import { Settings_0_5_4 } from 'src/stores/settings/migrations/old-settings-type';

const VALID_GRID_ORIENTATIONS = new Set([
    'south-start',
    'left-to-right',
    'bottom-to-top',
]);

const isMandalaGridOrientation = (
    value: unknown,
): value is MandalaGridOrientation =>
    typeof value === 'string' && VALID_GRID_ORIENTATIONS.has(value);

const normalizeSectionIds = (sections: unknown) => {
    if (!Array.isArray(sections)) return [];
    const values = (sections as unknown[])
        .map((section) =>
            typeof section === 'number' ? String(section) : section,
        )
        .filter((section): section is string => typeof section === 'string');
    return Array.from(new Set(values));
};

const normalizeSectionColors = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result: Record<string, string[]> = {};
    for (const [key, sections] of Object.entries(value)) {
        const normalized = normalizeSectionIds(sections);
        if (normalized.length > 0) {
            result[key] = normalized;
        }
    }
    return result;
};

const createDefaultMandalaView = () => ({
    gridOrientation: null as MandalaGridOrientation | null,
    lastActiveSection: null as string | null,
    pinnedSections: [] as string[],
    sectionColors: {} as Record<string, string[]>,
});

export const migrateSettings = (settings: Settings | Settings_0_5_4) => {
    for (const [path, pref] of Object.entries(settings.documents)) {
        if (typeof pref === 'boolean') {
            settings.documents[path] = {
                documentFormat: 'sections',
                viewType: 'mandala-grid',
                activeSection: null,
                outline: null,
                mandalaView: createDefaultMandalaView(),
            };
        } else if (pref && typeof pref === 'object') {
            const legacyPref = pref as Settings['documents'][string] & {
                pinnedSections?: unknown;
                mandalaView?: unknown;
            };
            delete legacyPref.pinnedSections;

            const mandalaViewRaw =
                legacyPref.mandalaView &&
                typeof legacyPref.mandalaView === 'object' &&
                !Array.isArray(legacyPref.mandalaView)
                    ? (legacyPref.mandalaView as Record<string, unknown>)
                    : null;
            if (!mandalaViewRaw) {
                legacyPref.mandalaView = createDefaultMandalaView();
            } else {
                legacyPref.mandalaView = {
                    gridOrientation: isMandalaGridOrientation(
                        mandalaViewRaw.gridOrientation,
                    )
                        ? mandalaViewRaw.gridOrientation
                        : null,
                    lastActiveSection:
                        typeof mandalaViewRaw.lastActiveSection === 'string'
                            ? mandalaViewRaw.lastActiveSection
                            : null,
                    pinnedSections: normalizeSectionIds(
                        mandalaViewRaw.pinnedSections,
                    ),
                    sectionColors: normalizeSectionColors(
                        mandalaViewRaw.sectionColors,
                    ),
                };
            }
        }
    }

    if ('backup' in settings) {
        const settingsWithBackup = settings as unknown as Settings & {
            backup?: unknown;
        };
        delete settingsWithBackup.backup;
    }

    const viewSettings = settings.view as {
        showMandalaDetailSidebar?: boolean;
        showMandalaDetailSidebarDesktop?: boolean;
        showMandalaDetailSidebarMobile?: boolean;
        mandalaA4Mode?: boolean;
        mandalaA4Orientation?: 'portrait' | 'landscape';
        mandalaBackgroundMode?: 'none' | 'custom' | 'gray';
        mandalaGridBorderOpacity?: number;
        mandalaGridOrientation?:
            | 'south-start'
            | 'left-to-right'
            | 'bottom-to-top';
        mandalaShowSectionColors?: boolean;
        mandalaSectionColorOpacity?: number;
        mandalaGrayBackground?: boolean;
        show3x3SubgridNavButtons?: boolean;
        show9x9ParallelNavButtons?: boolean;
        show3x3SubgridNavButtonsDesktop?: boolean;
        show3x3SubgridNavButtonsMobile?: boolean;
        show9x9ParallelNavButtonsDesktop?: boolean;
        show9x9ParallelNavButtonsMobile?: boolean;
    };
    if (typeof viewSettings.showMandalaDetailSidebar === 'boolean') {
        viewSettings.showMandalaDetailSidebarDesktop =
            viewSettings.showMandalaDetailSidebar;
        viewSettings.showMandalaDetailSidebarMobile =
            viewSettings.showMandalaDetailSidebar;
        delete viewSettings.showMandalaDetailSidebar;
    }
    if (viewSettings.mandalaA4Mode === undefined) {
        viewSettings.mandalaA4Mode = false;
    }
    if (viewSettings.mandalaA4Orientation === undefined) {
        viewSettings.mandalaA4Orientation = 'landscape';
    }
    if (viewSettings.mandalaBackgroundMode === undefined) {
        if (viewSettings.mandalaShowSectionColors) {
            viewSettings.mandalaBackgroundMode = 'custom';
        } else if (viewSettings.mandalaGrayBackground) {
            viewSettings.mandalaBackgroundMode = 'gray';
        } else {
            viewSettings.mandalaBackgroundMode = 'none';
        }
    }
    if (viewSettings.mandalaGridBorderOpacity === undefined) {
        viewSettings.mandalaGridBorderOpacity = 100;
    }
    if (viewSettings.mandalaGridOrientation === undefined) {
        viewSettings.mandalaGridOrientation = 'left-to-right';
    }
    if (viewSettings.mandalaSectionColorOpacity === undefined) {
        viewSettings.mandalaSectionColorOpacity = 100;
    }

    // Legacy compatibility: split old shared toggle flags into desktop/mobile.
    if (typeof viewSettings.show3x3SubgridNavButtons === 'boolean') {
        if (viewSettings.show3x3SubgridNavButtonsDesktop === undefined) {
            viewSettings.show3x3SubgridNavButtonsDesktop =
                viewSettings.show3x3SubgridNavButtons;
        }
        if (viewSettings.show3x3SubgridNavButtonsMobile === undefined) {
            viewSettings.show3x3SubgridNavButtonsMobile =
                viewSettings.show3x3SubgridNavButtons;
        }
        delete viewSettings.show3x3SubgridNavButtons;
    }
    if (typeof viewSettings.show9x9ParallelNavButtons === 'boolean') {
        if (viewSettings.show9x9ParallelNavButtonsDesktop === undefined) {
            viewSettings.show9x9ParallelNavButtonsDesktop =
                viewSettings.show9x9ParallelNavButtons;
        }
        if (viewSettings.show9x9ParallelNavButtonsMobile === undefined) {
            viewSettings.show9x9ParallelNavButtonsMobile =
                viewSettings.show9x9ParallelNavButtons;
        }
        delete viewSettings.show9x9ParallelNavButtons;
    }
};
