import {
    DocumentPreferences,
    MandalaCustomLayout,
    MandalaSectionColorAssignments,
    Settings,
} from './settings-type';
import { changeZoomLevel } from 'src/stores/settings/reducers/change-zoom-level';
import { CommandName } from 'src/lang/hotkey-groups';
import { toggleEditorState } from 'src/stores/settings/reducers/toggle-editor-state';
import { setHotkeyAsBlank } from 'src/stores/settings/reducers/set-hotkey-as-blank';
import { SettingsActions } from 'src/stores/settings/settings-store-actions';
import { Platform } from 'obsidian';
import { normalizeContextMenuCopyLinkVisibility } from 'src/stores/settings/helpers/context-menu-copy-link-visibility';
import { compareSectionIds } from 'src/mandala-v2/section-utils';
import {
    layoutIdToOrientation,
    normalizeCustomMandalaPattern,
    normalizeMandalaCustomLayouts,
} from 'src/view/helpers/mandala/mandala-grid-custom-layout';

type SettingsActionHandler = (store: Settings, action: SettingsActions) => void;

const normalizeSectionIds = (sections: string[]) =>
    Array.from(new Set(sections)).sort(compareSectionIds);

const normalizeSectionIdsFromUnknown = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    const sections = value as unknown[];
    return normalizeSectionIds(
        sections
            .map((section) =>
                typeof section === 'number' ? String(section) : section,
            )
            .filter(
                (section): section is string => typeof section === 'string',
            ),
    );
};

const normalizeSectionColorAssignments = (
    value: unknown,
): MandalaSectionColorAssignments => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    const result: MandalaSectionColorAssignments = {};
    for (const [key, sections] of Object.entries(value)) {
        const normalized = normalizeSectionIdsFromUnknown(sections);
        if (normalized.length > 0) {
            result[key] = normalized;
        }
    }
    return result;
};

const createDefaultDocumentPreferences = (): DocumentPreferences => ({
    viewType: 'mandala-grid',
    activeSection: null,
    outline: null,
    mandalaView: {
        gridOrientation: null,
        selectedLayoutId: null,
        selectedCustomLayout: null,
        lastActiveSection: null,
        subgridTheme: null,
        showDetailSidebarDesktop: null,
        showDetailSidebarMobile: null,
        pinnedSections: [],
        sectionColors: {},
    },
});

const getOrCreateDocumentPreferences = (store: Settings, path: string) => {
    if (!store.documents[path]) {
        store.documents[path] = createDefaultDocumentPreferences();
    }
    return store.documents[path];
};

const getOrCreateMandalaViewPreferences = (
    preferences: DocumentPreferences,
) => {
    if (
        !preferences.mandalaView ||
        typeof preferences.mandalaView !== 'object'
    ) {
        preferences.mandalaView = {
            gridOrientation: null,
            selectedLayoutId: null,
            selectedCustomLayout: null,
            lastActiveSection: null,
            subgridTheme: null,
            showDetailSidebarDesktop: null,
            showDetailSidebarMobile: null,
            pinnedSections: [],
            sectionColors: {},
        };
    }
    if (preferences.mandalaView.selectedCustomLayout === undefined) {
        preferences.mandalaView.selectedCustomLayout = null;
    }
    return preferences.mandalaView;
};

const sameSections = (a: string[], b: string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

const settingsHandlers: Record<string, SettingsActionHandler> = {
    'settings/documents/delete-document-preferences': (store, action) => {
        if (action.type !== 'settings/documents/delete-document-preferences')
            return;
        delete store.documents[action.payload.path];
    },
    'settings/documents/set-view-type': (store, action) => {
        if (action.type !== 'settings/documents/set-view-type') return;
        const preferences = getOrCreateDocumentPreferences(
            store,
            action.payload.path,
        );
        preferences.viewType = action.payload.type;
    },
    'settings/document/persist-active-section': (store, action) => {
        if (action.type !== 'settings/document/persist-active-section') return;
        const preferences = getOrCreateDocumentPreferences(
            store,
            action.payload.path,
        );
        preferences.activeSection = action.payload.sectionNumber;
    },
    'settings/documents/persist-mandala-view-state': (store, action) => {
        if (action.type !== 'settings/documents/persist-mandala-view-state')
            return;
        const preferences = getOrCreateDocumentPreferences(
            store,
            action.payload.path,
        );
        const mandalaView = getOrCreateMandalaViewPreferences(preferences);
        mandalaView.gridOrientation = action.payload.gridOrientation;
        mandalaView.selectedLayoutId = action.payload.selectedLayoutId;
        mandalaView.selectedCustomLayout =
            action.payload.selectedCustomLayout ?? null;
        mandalaView.lastActiveSection = action.payload.lastActiveSection;
        mandalaView.subgridTheme = action.payload.subgridTheme;
        mandalaView.showDetailSidebarDesktop =
            action.payload.showDetailSidebarDesktop;
        mandalaView.showDetailSidebarMobile =
            action.payload.showDetailSidebarMobile;
    },
    'settings/documents/persist-mandala-pinned-sections': (store, action) => {
        if (
            action.type !== 'settings/documents/persist-mandala-pinned-sections'
        ) {
            return;
        }
        const preferences = getOrCreateDocumentPreferences(
            store,
            action.payload.path,
        );
        const normalized = normalizeSectionIds(action.payload.sections);
        const mandalaView = getOrCreateMandalaViewPreferences(preferences);
        const current = normalizeSectionIdsFromUnknown(
            mandalaView.pinnedSections,
        );
        if (sameSections(current, normalized)) return;
        mandalaView.pinnedSections = normalized;
    },
    'settings/documents/persist-mandala-section-colors': (store, action) => {
        if (action.type !== 'settings/documents/persist-mandala-section-colors')
            return;
        const preferences = getOrCreateDocumentPreferences(
            store,
            action.payload.path,
        );
        const normalized = normalizeSectionColorAssignments(action.payload.map);
        const mandalaView = getOrCreateMandalaViewPreferences(preferences);
        const current = normalizeSectionColorAssignments(
            mandalaView.sectionColors,
        );
        if (JSON.stringify(current) === JSON.stringify(normalized)) return;
        mandalaView.sectionColors = normalized;
    },
    'settings/documents/update-document-path': (store, action) => {
        if (action.type !== 'settings/documents/update-document-path') return;
        const preferences = store.documents[action.payload.oldPath];
        delete store.documents[action.payload.oldPath];
        store.documents[action.payload.newPath] = preferences;
    },
    'settings/hotkeys/update-custom-hotkeys': (store, action) => {
        if (action.type !== 'settings/hotkeys/update-custom-hotkeys') return;
        store.hotkeys.customHotkeys = action.payload.customHotkeys;
    },
    'settings/view/theme/set-font-size': (store, action) => {
        if (action.type !== 'settings/view/theme/set-font-size') return;
        store.view.fontSize = action.payload.fontSize;
    },
    'settings/view/theme/set-h1-font-size': (store, action) => {
        if (action.type !== 'settings/view/theme/set-h1-font-size') return;
        store.view.h1FontSize_em = action.payload.fontSize_em;
    },
    'settings/view/font-size/set-3x3-desktop': (store, action) => {
        if (action.type !== 'settings/view/font-size/set-3x3-desktop') return;
        store.view.mandalaFontSize3x3Desktop = action.payload.fontSize;
    },
    'settings/view/font-size/set-3x3-mobile': (store, action) => {
        if (action.type !== 'settings/view/font-size/set-3x3-mobile') return;
        store.view.mandalaFontSize3x3Mobile = action.payload.fontSize;
    },
    'settings/view/font-size/set-9x9-desktop': (store, action) => {
        if (action.type !== 'settings/view/font-size/set-9x9-desktop') return;
        store.view.mandalaFontSize9x9Desktop = action.payload.fontSize;
    },
    'settings/view/font-size/set-9x9-mobile': (store, action) => {
        if (action.type !== 'settings/view/font-size/set-9x9-mobile') return;
        store.view.mandalaFontSize9x9Mobile = action.payload.fontSize;
    },
    'settings/view/font-size/set-sidebar-desktop': (store, action) => {
        if (action.type !== 'settings/view/font-size/set-sidebar-desktop')
            return;
        store.view.mandalaFontSizeSidebarDesktop = action.payload.fontSize;
    },
    'settings/view/font-size/set-sidebar-mobile': (store, action) => {
        if (action.type !== 'settings/view/font-size/set-sidebar-mobile')
            return;
        store.view.mandalaFontSizeSidebarMobile = action.payload.fontSize;
    },
    'settings/view/theme/set-container-bg-color': (store, action) => {
        if (action.type !== 'settings/view/theme/set-container-bg-color')
            return;
        store.view.theme.containerBg = action.payload.backgroundColor;
    },
    'settings/view/theme/set-active-branch-bg-color': (store, action) => {
        if (action.type !== 'settings/view/theme/set-active-branch-bg-color')
            return;
        store.view.theme.activeBranchBg = action.payload.backgroundColor;
    },
    'settings/view/layout/set-card-width': (store, action) => {
        if (action.type !== 'settings/view/layout/set-card-width') return;
        store.view.cardWidth = action.payload.width;
    },
    'settings/view/layout/set-min-card-height': (store, action) => {
        if (action.type !== 'settings/view/layout/set-min-card-height') return;
        store.view.minimumCardHeight = action.payload.height;
    },
    'settings/view/layout/set-limit-card-height': (store, action) => {
        if (action.type !== 'settings/view/layout/set-limit-card-height')
            return;
        store.view.limitPreviewHeight = action.payload.limit;
    },
    'settings/documents/remove-stale-documents': (store, action) => {
        if (action.type !== 'settings/documents/remove-stale-documents') return;
        store.documents = { ...action.payload.documents };
    },
    'settings/view/set-zoom-level': (store, action) => {
        if (action.type !== 'settings/view/set-zoom-level') return;
        changeZoomLevel(store, action.payload);
    },
    'view/left-sidebar/toggle': (store, action) => {
        if (action.type !== 'view/left-sidebar/toggle') return;
        store.view.showLeftSidebar = !store.view.showLeftSidebar;
    },
    'settings/view/toggle-horizontal-scrolling-mode': (store, action) => {
        if (action.type !== 'settings/view/toggle-horizontal-scrolling-mode')
            return;
        store.view.scrolling.centerActiveNodeH =
            !store.view.scrolling.centerActiveNodeH;
        store.view.scrolling = {
            ...store.view.scrolling,
        };
    },
    'settings/view/toggle-vertical-scrolling-mode': (store, action) => {
        if (action.type !== 'settings/view/toggle-vertical-scrolling-mode')
            return;
        store.view.scrolling.centerActiveNodeV =
            !store.view.scrolling.centerActiveNodeV;
        store.view.scrolling = {
            ...store.view.scrolling,
        };
    },
    'settings/view/layout/set-cards-gap': (store, action) => {
        if (action.type !== 'settings/view/layout/set-cards-gap') return;
        store.view.cardsGap = action.payload.gap;
    },
    'view/left-sidebar/set-width': (store, action) => {
        if (action.type !== 'view/left-sidebar/set-width') return;
        if (action.payload.width > 0) {
            store.view.leftSidebarWidth = action.payload.width;
        }
    },
    'view/left-sidebar/set-active-tab': (store, action) => {
        if (action.type !== 'view/left-sidebar/set-active-tab') return;
        store.view.leftSidebarActiveTab = 'pinned-cards';
    },
    'view/modes/gap-between-cards/toggle': (store, action) => {
        if (action.type !== 'view/modes/gap-between-cards/toggle') return;
        store.view.applyGapBetweenCards = !store.view.applyGapBetweenCards;
    },
    'settings/view/mandala/toggle-mode': (store, action) => {
        if (action.type !== 'settings/view/mandala/toggle-mode') return;
        store.view.mandalaMode =
            store.view.mandalaMode === '9x9' ? '3x3' : '9x9';
    },
    'view/mandala-detail-sidebar/toggle': (store, action) => {
        if (action.type !== 'view/mandala-detail-sidebar/toggle') return;
        if (Platform.isMobile) {
            store.view.showMandalaDetailSidebarMobile =
                !store.view.showMandalaDetailSidebarMobile;
            return;
        }
        store.view.showMandalaDetailSidebarDesktop =
            !store.view.showMandalaDetailSidebarDesktop;
    },
    'view/mandala-detail-sidebar/set-width': (store, action) => {
        if (action.type !== 'view/mandala-detail-sidebar/set-width') return;
        if (action.payload.width > 0) {
            store.view.mandalaDetailSidebarWidth = action.payload.width;
        }
    },
    'settings/view/theme/set-inactive-node-opacity': (store, action) => {
        if (action.type !== 'settings/view/theme/set-inactive-node-opacity')
            return;
        store.view.theme.inactiveNodeOpacity = action.payload.opacity;
    },
    'settings/view/theme/set-active-branch-color': (store, action) => {
        if (action.type !== 'settings/view/theme/set-active-branch-color')
            return;
        if (action.payload.color) {
            store.view.theme.activeBranchColor = action.payload.color;
        } else {
            delete store.view.theme.activeBranchColor;
        }
    },
    'settings/hotkeys/set-custom-hotkey': (store, action) => {
        if (action.type !== 'settings/hotkeys/set-custom-hotkey') return;
        const customHotkey =
            store.hotkeys.customHotkeys[action.payload.command];
        if (!customHotkey) {
            store.hotkeys.customHotkeys[action.payload.command] = {
                [action.payload.type]: action.payload.hotkey,
            };
            return;
        }
        customHotkey[action.payload.type] = {
            ...customHotkey[action.payload.type],
            ...action.payload.hotkey,
        };
        store.hotkeys.customHotkeys = { ...store.hotkeys.customHotkeys };
    },
    'settings/hotkeys/reset-custom-hotkey': (store, action) => {
        if (action.type !== 'settings/hotkeys/reset-custom-hotkey') return;
        const customHotkey =
            store.hotkeys.customHotkeys[action.payload.command];
        if (customHotkey) {
            delete customHotkey[action.payload.type];
        }
        store.hotkeys.customHotkeys = { ...store.hotkeys.customHotkeys };
    },
    'settings/hotkeys/apply-preset': (store, action) => {
        if (action.type !== 'settings/hotkeys/apply-preset') return;
        const preset = action.payload.preset;
        for (const command of Object.keys(preset) as CommandName[]) {
            const customHotkeys = preset[command];
            if (!customHotkeys) continue;
            const hotkeys = store.hotkeys.customHotkeys[command] ?? {};
            if (customHotkeys.primary) {
                hotkeys.primary = customHotkeys.primary;
            }
            if (customHotkeys.secondary) {
                hotkeys.secondary = customHotkeys.secondary;
            }
            store.hotkeys.customHotkeys[command] = hotkeys;
        }
        store.hotkeys.customHotkeys = {
            ...store.hotkeys.customHotkeys,
        };
    },
    'settings/hotkeys/reset-all': (store, action) => {
        if (action.type !== 'settings/hotkeys/reset-all') return;
        store.hotkeys.customHotkeys = {};
    },
    'settings/hotkeys/toggle-editor-state': (store, action) => {
        if (action.type !== 'settings/hotkeys/toggle-editor-state') return;
        toggleEditorState(store, action);
    },
    'settings/hotkeys/set-blank': (store, action) => {
        if (action.type !== 'settings/hotkeys/set-blank') return;
        setHotkeyAsBlank(store, action);
    },
    'settings/view/set-always-show-card-buttons': (store, action) => {
        if (action.type !== 'settings/view/set-always-show-card-buttons')
            return;
        store.view.alwaysShowCardButtons = action.payload.show;
    },
    'settings/view/set-mandala-embed-debug': (store, action) => {
        if (action.type !== 'settings/view/set-mandala-embed-debug') return;
        store.view.mandalaEmbedDebug = action.payload.enabled;
    },
    'settings/view/vertical-toolbar/set-hidden-button': (store, action) => {
        if (action.type !== 'settings/view/vertical-toolbar/set-hidden-button')
            return;
        if (action.payload.hide) {
            store.view.hiddenVerticalToolbarButtons = Array.from(
                new Set([
                    ...store.view.hiddenVerticalToolbarButtons,
                    action.payload.id,
                ]),
            );
            return;
        }
        store.view.hiddenVerticalToolbarButtons =
            store.view.hiddenVerticalToolbarButtons.filter(
                (b) => b !== action.payload.id,
            );
    },
    'settings/view/toggle-hidden-card-info': (store, action) => {
        if (action.type !== 'settings/view/toggle-hidden-card-info') return;
        store.view.showHiddenCardInfo = !store.view.showHiddenCardInfo;
    },
    'settings/view/detail-sidebar/set-preview-mode': (store, action) => {
        if (action.type !== 'settings/view/detail-sidebar/set-preview-mode')
            return;
        if (Platform.isMobile) {
            store.view.detailSidebarPreviewModeMobile = action.payload.mode;
            return;
        }
        store.view.detailSidebarPreviewModeDesktop = action.payload.mode;
    },
    'settings/view/toggle-3x3-subgrid-nav-buttons-desktop': (store, action) => {
        if (
            action.type !==
            'settings/view/toggle-3x3-subgrid-nav-buttons-desktop'
        ) {
            return;
        }
        store.view.show3x3SubgridNavButtonsDesktop = !(
            store.view.show3x3SubgridNavButtonsDesktop ?? true
        );
    },
    'settings/view/toggle-3x3-subgrid-nav-buttons-mobile': (store, action) => {
        if (
            action.type !==
            'settings/view/toggle-3x3-subgrid-nav-buttons-mobile'
        ) {
            return;
        }
        store.view.show3x3SubgridNavButtonsMobile = !(
            store.view.show3x3SubgridNavButtonsMobile ?? true
        );
    },
    'settings/view/toggle-9x9-parallel-nav-buttons-desktop': (
        store,
        action,
    ) => {
        if (
            action.type !==
            'settings/view/toggle-9x9-parallel-nav-buttons-desktop'
        ) {
            return;
        }
        store.view.show9x9ParallelNavButtonsDesktop = !(
            store.view.show9x9ParallelNavButtonsDesktop ?? true
        );
    },
    'settings/view/toggle-9x9-parallel-nav-buttons-mobile': (store, action) => {
        if (
            action.type !==
            'settings/view/toggle-9x9-parallel-nav-buttons-mobile'
        ) {
            return;
        }
        store.view.show9x9ParallelNavButtonsMobile = !(
            store.view.show9x9ParallelNavButtonsMobile ?? true
        );
    },
    'settings/view/toggle-day-plan-today-button-desktop': (store, action) => {
        if (
            action.type !==
            'settings/view/toggle-day-plan-today-button-desktop'
        ) {
            return;
        }
        store.view.showDayPlanTodayButtonDesktop = !(
            store.view.showDayPlanTodayButtonDesktop ?? true
        );
    },
    'settings/view/toggle-day-plan-today-button-mobile': (store, action) => {
        if (
            action.type !== 'settings/view/toggle-day-plan-today-button-mobile'
        ) {
            return;
        }
        store.view.showDayPlanTodayButtonMobile = !(
            store.view.showDayPlanTodayButtonMobile ?? true
        );
    },
    'settings/view/context-menu-copy-link/set-visibility': (store, action) => {
        if (
            action.type !==
            'settings/view/context-menu-copy-link/set-visibility'
        ) {
            return;
        }
        if (Platform.isMobile) {
            const current = normalizeContextMenuCopyLinkVisibility(
                store.view.contextMenuCopyLinkVisibilityMobile,
            );
            store.view.contextMenuCopyLinkVisibilityMobile = {
                ...current,
                [action.payload.variant]: action.payload.visible,
            };
            return;
        }
        const current = normalizeContextMenuCopyLinkVisibility(
            store.view.contextMenuCopyLinkVisibilityDesktop,
        );
        store.view.contextMenuCopyLinkVisibilityDesktop = {
            ...current,
            [action.payload.variant]: action.payload.visible,
        };
    },
    'settings/general/set-link-pane-type': (store, action) => {
        if (action.type !== 'settings/general/set-link-pane-type') return;
        store.general.linkPaneType = action.payload.position;
    },
    'settings/general/set-mandala-templates-file-path': (store, action) => {
        if (action.type !== 'settings/general/set-mandala-templates-file-path')
            return;
        store.general.mandalaTemplatesFilePath = action.payload.path;
    },
    'settings/view/set-mobile-edit-font-size-offset': (store, action) => {
        if (action.type !== 'settings/view/set-mobile-edit-font-size-offset')
            return;
        store.view.mobileEditFontSizeOffset = action.payload.offset;
    },
    'settings/view/toggle-9x9-title-only': (store, action) => {
        if (action.type !== 'settings/view/toggle-9x9-title-only') return;
        store.view.show9x9TitleOnly = !store.view.show9x9TitleOnly;
    },
    'settings/view/toggle-square-layout': (store, action) => {
        if (action.type !== 'settings/view/toggle-square-layout') return;
        store.view.squareLayout = !store.view.squareLayout;
    },
    'settings/view/toggle-white-theme': (store, action) => {
        if (action.type !== 'settings/view/toggle-white-theme') return;
        store.view.whiteThemeMode = !store.view.whiteThemeMode;
    },
    'settings/view/mandala/set-grid-orientation': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-grid-orientation')
            return;
        store.view.mandalaGridOrientation = action.payload.orientation;
        if (action.payload.orientation === 'left-to-right') {
            store.view.mandalaGridSelectedLayoutId = 'builtin:left-to-right';
        } else if (action.payload.orientation === 'south-start') {
            store.view.mandalaGridSelectedLayoutId = 'builtin:south-start';
        }
    },
    'settings/view/mandala/select-grid-layout': (store, action) => {
        if (action.type !== 'settings/view/mandala/select-grid-layout') return;
        store.view.mandalaGridSelectedLayoutId = action.payload.layoutId;
        store.view.mandalaGridOrientation = layoutIdToOrientation(
            action.payload.layoutId,
        );
    },
    'settings/view/mandala/add-custom-grid-layout': (store, action) => {
        if (action.type !== 'settings/view/mandala/add-custom-grid-layout')
            return;
        const currentLayouts = normalizeMandalaCustomLayouts(
            store.view.mandalaGridCustomLayouts,
        );
        const nextLayout: MandalaCustomLayout = {
            id: action.payload.layout.id,
            name: action.payload.layout.name.trim() || '未命名布局',
            pattern: normalizeCustomMandalaPattern(
                action.payload.layout.pattern,
            ),
        };
        store.view.mandalaGridCustomLayouts = [...currentLayouts, nextLayout];
    },
    'settings/view/mandala/create-custom-grid-layout': (store, action) => {
        if (action.type !== 'settings/view/mandala/create-custom-grid-layout')
            return;
        const currentLayouts = normalizeMandalaCustomLayouts(
            store.view.mandalaGridCustomLayouts,
        );
        const nextLayout: MandalaCustomLayout = {
            id: action.payload.layout.id,
            name: action.payload.layout.name.trim() || '未命名布局',
            pattern: normalizeCustomMandalaPattern(
                action.payload.layout.pattern,
            ),
        };
        store.view.mandalaGridCustomLayouts = [...currentLayouts, nextLayout];
    },
    'settings/view/mandala/update-custom-grid-layout': (store, action) => {
        if (action.type !== 'settings/view/mandala/update-custom-grid-layout')
            return;
        store.view.mandalaGridCustomLayouts = normalizeMandalaCustomLayouts(
            store.view.mandalaGridCustomLayouts,
        ).map((layout) =>
            layout.id === action.payload.id
                ? {
                      ...layout,
                      name: action.payload.name.trim() || '未命名布局',
                      pattern: normalizeCustomMandalaPattern(
                          action.payload.pattern,
                      ),
                  }
                : layout,
        );
    },
    'settings/view/mandala/delete-custom-grid-layout': (store, action) => {
        if (action.type !== 'settings/view/mandala/delete-custom-grid-layout')
            return;
        store.view.mandalaGridCustomLayouts = normalizeMandalaCustomLayouts(
            store.view.mandalaGridCustomLayouts,
        ).filter((layout) => layout.id !== action.payload.id);
        if (store.view.mandalaGridSelectedLayoutId === action.payload.id) {
            store.view.mandalaGridSelectedLayoutId = 'builtin:left-to-right';
            store.view.mandalaGridOrientation = 'left-to-right';
        }
    },
    'settings/view/mandala/toggle-a4-mode': (store, action) => {
        if (action.type !== 'settings/view/mandala/toggle-a4-mode') return;
        store.view.mandalaA4Mode = !store.view.mandalaA4Mode;
    },
    'settings/view/mandala/set-a4-orientation': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-a4-orientation') return;
        store.view.mandalaA4Orientation = action.payload.orientation;
    },
    'settings/view/mandala/set-background-mode': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-background-mode') return;
        store.view.mandalaBackgroundMode = action.payload.mode;
    },
    'settings/view/mandala/set-border-opacity': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-border-opacity') return;
        store.view.mandalaGridBorderOpacity = action.payload.opacity;
    },
    'settings/view/mandala/set-grid-highlight-color': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-grid-highlight-color') {
            return;
        }
        if (action.payload.color) {
            store.view.mandalaGridHighlightColor = action.payload.color;
        } else {
            delete store.view.mandalaGridHighlightColor;
        }
    },
    'settings/view/mandala/set-grid-highlight-width': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-grid-highlight-width') {
            return;
        }
        store.view.mandalaGridHighlightWidth = action.payload.width;
    },
    'settings/view/mandala/set-section-color-opacity': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-section-color-opacity')
            return;
        store.view.mandalaSectionColorOpacity = action.payload.opacity;
    },
    'settings/view/mandala/set-last-export-preset': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-last-export-preset')
            return;
        store.view.lastExportPreset = action.payload.preset;
    },
    'settings/general/set-day-plan-enabled': (store, action) => {
        if (action.type !== 'settings/general/set-day-plan-enabled') return;
        store.general.dayPlanEnabled = action.payload.enabled;
    },
};

const updateState = (store: Settings, action: SettingsActions) => {
    const handler = settingsHandlers[action.type];
    if (handler) {
        handler(store, action);
    }
};

export const settingsReducer = (
    store: Settings,
    action: SettingsActions,
): Settings => {
    updateState(store, action);
    return store;
};
