import { DEFAULT_MANDALA_GRID_HIGHLIGHT_WIDTH } from 'src/stores/settings/default-settings';
import {
    DEFAULT_MANDALA_CELL_PREVIEW_FONT_SIZE_DESKTOP,
    DEFAULT_MANDALA_CELL_PREVIEW_FONT_SIZE_MOBILE,
} from 'src/stores/settings/default-settings';
import { Settings_0_5_4 } from 'src/stores/settings/migrations/old-settings-type';
import {
    MandalaCustomLayout,
    MandalaGridOrientation,
    Settings,
} from 'src/stores/settings/settings-type';
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
    selectedCustomLayout: null as MandalaCustomLayout | null,
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

const normalizeSelectedCustomLayout = (
    value: unknown,
    selectedLayoutId: string | null,
): MandalaCustomLayout | null => {
    if (!selectedLayoutId?.startsWith('custom:')) return null;
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const raw = value as Record<string, unknown>;
    const id =
        typeof raw.id === 'string' && raw.id.trim().length > 0
            ? raw.id.trim()
            : selectedLayoutId;
    if (id !== selectedLayoutId) return null;
    const name =
        typeof raw.name === 'string' && raw.name.trim().length > 0
            ? raw.name.trim()
            : '未命名布局';
    return {
        id,
        name,
        pattern:
            normalizeMandalaCustomLayouts([raw])[0]?.pattern ?? '123405678',
    };
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
                    selectedCustomLayout: normalizeSelectedCustomLayout(
                        mandalaViewRaw.selectedCustomLayout,
                        selectedLayoutId,
                    ),
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
        mandalaGridHighlightColor?: unknown;
        mandalaGridHighlightWidth?: number;
        mandalaGridOrientation?: MandalaGridOrientation;
        mandalaGridSelectedLayoutId?: unknown;
        mandalaGridCustomLayouts?: unknown;
        mandalaShowSectionColors?: boolean;
        mandalaSectionColorOpacity?: number;
        mandalaFontSize7x9Desktop?: number;
        mandalaFontSize7x9Mobile?: number;
        mandalaCellPreviewFontSizeDesktop?: number;
        mandalaCellPreviewFontSizeMobile?: number;
        mandalaGrayBackground?: boolean;
        show3x3SubgridNavButtons?: boolean;
        show9x9ParallelNavButtons?: boolean;
        show3x3SubgridNavButtonsDesktop?: boolean;
        show3x3SubgridNavButtonsMobile?: boolean;
        show9x9ParallelNavButtonsDesktop?: boolean;
        show9x9ParallelNavButtonsMobile?: boolean;
        showCellQuickPreviewDialogDesktop?: boolean;
        showCellQuickPreviewDialogMobile?: boolean;
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
    if (typeof viewSettings.mandalaGridHighlightColor !== 'string') {
        delete viewSettings.mandalaGridHighlightColor;
    }
    if (viewSettings.mandalaGridHighlightWidth === undefined) {
        viewSettings.mandalaGridHighlightWidth =
            DEFAULT_MANDALA_GRID_HIGHLIGHT_WIDTH;
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
    viewSettings.mandalaGridOrientation =
        layoutIdToOrientation(selectedLayoutId);
    if (viewSettings.mandalaSectionColorOpacity === undefined) {
        viewSettings.mandalaSectionColorOpacity = 100;
    }
    const generalSettings = (settings as Settings).general as {
        defaultDocumentFormat?: unknown;
        weekPlanEnabled?: unknown;
        weekPlanCompactMode?: unknown;
        weekStart?: unknown;
        dayPlanDateHeadingFormat?: unknown;
        dayPlanDateHeadingCustomTemplate?: unknown;
        dayPlanDateHeadingApplyMode?: unknown;
    };
    delete generalSettings.defaultDocumentFormat;
    if (typeof generalSettings.weekPlanEnabled !== 'boolean') {
        generalSettings.weekPlanEnabled = true;
    }
    if (typeof generalSettings.weekPlanCompactMode !== 'boolean') {
        generalSettings.weekPlanCompactMode = true;
    }
    if (
        generalSettings.weekStart !== 'monday' &&
        generalSettings.weekStart !== 'sunday'
    ) {
        generalSettings.weekStart = 'monday';
    }
    if (
        generalSettings.dayPlanDateHeadingFormat !== 'date-only' &&
        generalSettings.dayPlanDateHeadingFormat !== 'zh-short' &&
        generalSettings.dayPlanDateHeadingFormat !== 'zh-full' &&
        generalSettings.dayPlanDateHeadingFormat !== 'en-short' &&
        generalSettings.dayPlanDateHeadingFormat !== 'custom'
    ) {
        generalSettings.dayPlanDateHeadingFormat = 'zh-short';
    }
    if (typeof generalSettings.dayPlanDateHeadingCustomTemplate !== 'string') {
        generalSettings.dayPlanDateHeadingCustomTemplate = '## {date} {cn}';
    }
    if (
        generalSettings.dayPlanDateHeadingApplyMode !== 'immediate' &&
        generalSettings.dayPlanDateHeadingApplyMode !== 'manual'
    ) {
        generalSettings.dayPlanDateHeadingApplyMode = 'manual';
    }
    if (typeof viewSettings.mandalaFontSize7x9Desktop !== 'number') {
        viewSettings.mandalaFontSize7x9Desktop = 11;
    }
    if (typeof viewSettings.mandalaFontSize7x9Mobile !== 'number') {
        viewSettings.mandalaFontSize7x9Mobile = 10;
    }
    if (typeof viewSettings.mandalaCellPreviewFontSizeDesktop !== 'number') {
        viewSettings.mandalaCellPreviewFontSizeDesktop =
            DEFAULT_MANDALA_CELL_PREVIEW_FONT_SIZE_DESKTOP;
    }
    if (typeof viewSettings.mandalaCellPreviewFontSizeMobile !== 'number') {
        viewSettings.mandalaCellPreviewFontSizeMobile =
            DEFAULT_MANDALA_CELL_PREVIEW_FONT_SIZE_MOBILE;
    }
    if (typeof viewSettings.showCellQuickPreviewDialogDesktop !== 'boolean') {
        viewSettings.showCellQuickPreviewDialogDesktop = true;
    }
    if (typeof viewSettings.showCellQuickPreviewDialogMobile !== 'boolean') {
        viewSettings.showCellQuickPreviewDialogMobile = false;
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

    const customHotkeys = (settings as Settings).hotkeys
        .customHotkeys as Record<string, unknown>;
    delete customHotkeys.undo_change;
    delete customHotkeys.redo_change;
};
