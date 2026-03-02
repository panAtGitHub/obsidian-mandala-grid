import {
    MandalaGridOrientation,
    Settings,
} from 'src/stores/settings/settings-type';
import { Settings_0_5_4 } from 'src/stores/settings/migrations/old-settings-type';
import {
    BUILTIN_MANDALA_LAYOUT_IDS,
    layoutIdToOrientation,
    legacyOrientationToLayoutId,
    normalizeMandalaCustomLayouts,
    resolveMandalaLayoutId,
} from 'src/view/helpers/mandala/mandala-grid-custom-layout';

const VALID_GRID_ORIENTATIONS = new Set([
    'south-start',
    'left-to-right',
    'custom',
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
    selectedLayoutId: null as string | null,
    lastActiveSection: null as string | null,
    subgridTheme: null as string | null,
    showDetailSidebarDesktop: null as boolean | null,
    showDetailSidebarMobile: null as boolean | null,
    pinnedSections: [] as string[],
    sectionColors: {} as Record<string, string[]>,
});

const normalizeDocumentSelectedLayoutId = (
    value: unknown,
    legacyOrientation: MandalaGridOrientation | null,
    customLayouts: Settings['view']['mandalaGridCustomLayouts'],
) => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return resolveMandalaLayoutId(value, customLayouts);
    }
    const legacyLayoutId = legacyOrientationToLayoutId(legacyOrientation);
    return legacyLayoutId ?? null;
};

export const migrateSettings = (settings: Settings | Settings_0_5_4) => {
    const settingsViewRecord = settings.view as Record<string, unknown>;
    const normalizedCustomLayouts = normalizeMandalaCustomLayouts(
        settingsViewRecord.mandalaGridCustomLayouts,
    );
    for (const [path, pref] of Object.entries(settings.documents)) {
        if (typeof pref === 'boolean') {
            settings.documents[path] = {
                viewType: 'mandala-grid',
                activeSection: null,
                outline: null,
                mandalaView: createDefaultMandalaView(),
            };
        } else if (pref && typeof pref === 'object') {
            const legacyPref = pref as Settings['documents'][string] & {
                documentFormat?: unknown;
                pinnedSections?: unknown;
                mandalaView?: unknown;
            };
            delete legacyPref.documentFormat;
            legacyPref.outline = null;
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
                const rawLegacyOrientation =
                    typeof mandalaViewRaw.gridOrientation === 'string'
                        ? mandalaViewRaw.gridOrientation
                        : null;
                const legacyOrientation = isMandalaGridOrientation(
                    mandalaViewRaw.gridOrientation,
                )
                    ? mandalaViewRaw.gridOrientation
                    : rawLegacyOrientation === 'bottom-to-top'
                      ? 'left-to-right'
                      : null;
                const selectedLayoutId = normalizeDocumentSelectedLayoutId(
                    mandalaViewRaw.selectedLayoutId,
                    legacyOrientation,
                    normalizedCustomLayouts,
                );
                legacyPref.mandalaView = {
                    gridOrientation: selectedLayoutId
                        ? layoutIdToOrientation(selectedLayoutId)
                        : legacyOrientation,
                    selectedLayoutId,
                    lastActiveSection:
                        typeof mandalaViewRaw.lastActiveSection === 'string'
                            ? mandalaViewRaw.lastActiveSection
                            : null,
                    subgridTheme:
                        typeof mandalaViewRaw.subgridTheme === 'string'
                            ? mandalaViewRaw.subgridTheme
                            : null,
                    showDetailSidebarDesktop:
                        typeof mandalaViewRaw.showDetailSidebarDesktop ===
                        'boolean'
                            ? mandalaViewRaw.showDetailSidebarDesktop
                            : null,
                    showDetailSidebarMobile:
                        typeof mandalaViewRaw.showDetailSidebarMobile ===
                        'boolean'
                            ? mandalaViewRaw.showDetailSidebarMobile
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
    const settingsWithLegacyRoot = settings as unknown as Settings & {
        styleRules?: unknown;
    };
    delete settingsWithLegacyRoot.styleRules;

    const viewSettings = settings.view as {
        showMandalaDetailSidebar?: boolean;
        showMandalaDetailSidebarDesktop?: boolean;
        showMandalaDetailSidebarMobile?: boolean;
        detailSidebarPreviewMode?: unknown;
        detailSidebarPreviewModeDesktop?: 'rendered' | 'source';
        detailSidebarPreviewModeMobile?: 'rendered' | 'source';
        maintainEditMode?: unknown;
        mandalaA4Mode?: boolean;
        mandalaA4Orientation?: 'portrait' | 'landscape';
        mandalaBackgroundMode?: 'none' | 'custom' | 'gray';
        mandalaGridBorderOpacity?: number;
        mandalaGridOrientation?: MandalaGridOrientation;
        mandalaGridSelectedLayoutId?: unknown;
        mandalaGridCustomLayouts?: unknown;
        mandalaShowSectionColors?: boolean;
        mandalaSectionColorOpacity?: number;
        mandalaGrayBackground?: boolean;
        show3x3SubgridNavButtons?: boolean;
        show9x9ParallelNavButtons?: boolean;
        show3x3SubgridNavButtonsDesktop?: boolean;
        show3x3SubgridNavButtonsMobile?: boolean;
        show9x9ParallelNavButtonsDesktop?: boolean;
        show9x9ParallelNavButtonsMobile?: boolean;
        leftSidebarActiveTab?: unknown;
    };
    if (typeof viewSettings.showMandalaDetailSidebar === 'boolean') {
        viewSettings.showMandalaDetailSidebarDesktop =
            viewSettings.showMandalaDetailSidebar;
        viewSettings.showMandalaDetailSidebarMobile =
            viewSettings.showMandalaDetailSidebar;
        delete viewSettings.showMandalaDetailSidebar;
    }
    if ('detailSidebarPreviewMode' in viewSettings) {
        delete viewSettings.detailSidebarPreviewMode;
    }
    if ('maintainEditMode' in viewSettings) {
        delete viewSettings.maintainEditMode;
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
    const normalizedViewCustomLayouts = normalizeMandalaCustomLayouts(
        viewSettings.mandalaGridCustomLayouts,
    );
    viewSettings.mandalaGridCustomLayouts = normalizedViewCustomLayouts;
    const legacyViewLayoutId =
        legacyOrientationToLayoutId(viewSettings.mandalaGridOrientation) ??
        BUILTIN_MANDALA_LAYOUT_IDS['left-to-right'];
    const selectedLayoutId =
        typeof viewSettings.mandalaGridSelectedLayoutId === 'string'
            ? resolveMandalaLayoutId(
                  viewSettings.mandalaGridSelectedLayoutId,
                  normalizedViewCustomLayouts,
              )
            : resolveMandalaLayoutId(
                  legacyViewLayoutId,
                  normalizedViewCustomLayouts,
              );
    viewSettings.mandalaGridSelectedLayoutId = selectedLayoutId;
    viewSettings.mandalaGridOrientation = layoutIdToOrientation(selectedLayoutId);
    if (viewSettings.mandalaSectionColorOpacity === undefined) {
        viewSettings.mandalaSectionColorOpacity = 100;
    }
    const generalSettings = (settings as Settings).general as {
        defaultDocumentFormat?: unknown;
    };
    delete generalSettings.defaultDocumentFormat;

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
    if (viewSettings.leftSidebarActiveTab !== 'pinned-cards') {
        viewSettings.leftSidebarActiveTab = 'pinned-cards';
    }

    const legacyViewSettings = viewSettings as Record<string, unknown>;
    for (const key of [
        'showMinimap',
        'minimapWidth',
        'minimapPosition',
        'showOutline',
        'outlineMode',
        'showRecentNodes',
        'showHistory',
        'showSnapshotHistory',
        'showStyleRules',
        'showStyleRulesPanel',
        'styleRulesSidebarWidth',
    ]) {
        delete legacyViewSettings[key];
    }

    const customHotkeys = (
        settings as Settings
    ).hotkeys.customHotkeys as Record<string, unknown>;
    delete customHotkeys.undo_change;
    delete customHotkeys.redo_change;
};
