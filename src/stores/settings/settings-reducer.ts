import { Settings } from './settings-type';
import { changeZoomLevel } from 'src/stores/settings/reducers/change-zoom-level';
import { updateStyleRules } from 'src/stores/settings/reducers/update-style-rules/update-style-rules';
import { CommandName } from 'src/lang/hotkey-groups';
import { toggleEditorState } from 'src/stores/settings/reducers/toggle-editor-state';
import { setHotkeyAsBlank } from 'src/stores/settings/reducers/set-hotkey-as-blank';
import { PersistedViewHotkey } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import { persistCollapsedSections } from 'src/stores/settings/reducers/persist-collapsed-sections';
import { SettingsActions } from 'src/stores/settings/settings-store-actions';

const updateState = (store: Settings, action: SettingsActions) => {
    if (action.type === 'settings/documents/delete-document-preferences') {
        delete store.documents[action.payload.path];
        delete store.styleRules.documents[action.payload.path];
    } else if (action.type === 'settings/documents/set-document-format') {
        if (!store.documents[action.payload.path]) {
            store.documents[action.payload.path] = {
                documentFormat: action.payload.format,
                viewType: 'mandala-grid',
                activeSection: null,
                pinnedSections: {
                    sections: [],
                    activeSection: null,
                },
                outline: {
                    collapsedSections: [],
                },
            };
        } else {
            store.documents[action.payload.path].documentFormat =
                action.payload.format;
        }
    } else if (action.type === 'settings/documents/set-view-type') {
        if (store.documents[action.payload.path]) {
            store.documents[action.payload.path].viewType = action.payload.type;
        }
    } else if (action.type === 'settings/document/persist-active-section') {
        if (store.documents[action.payload.path]) {
            store.documents[action.payload.path].activeSection =
                action.payload.sectionNumber;
        }
    } else if (action.type === 'settings/documents/update-document-path') {
        const preferences = store.documents[action.payload.oldPath];
        delete store.documents[action.payload.oldPath];
        store.documents[action.payload.newPath] = preferences;

        if (store.styleRules.documents[action.payload.oldPath]) {
            const rules = store.styleRules.documents[action.payload.oldPath];
            delete store.styleRules.documents[action.payload.oldPath];
            store.styleRules.documents[action.payload.newPath] = rules;
        }
    } else if (action.type === 'settings/hotkeys/update-custom-hotkeys') {
        store.hotkeys.customHotkeys = action.payload.customHotkeys;
    } else if (action.type === 'settings/view/theme/set-font-size') {
        store.view.fontSize = action.payload.fontSize;
    } else if (action.type === 'settings/view/theme/set-h1-font-size') {
        store.view.h1FontSize_em = action.payload.fontSize_em;
    } else if (action.type === 'settings/view/font-size/set-3x3-desktop') {
        store.view.mandalaFontSize3x3Desktop = action.payload.fontSize;
    } else if (action.type === 'settings/view/font-size/set-3x3-mobile') {
        store.view.mandalaFontSize3x3Mobile = action.payload.fontSize;
    } else if (action.type === 'settings/view/font-size/set-9x9-desktop') {
        store.view.mandalaFontSize9x9Desktop = action.payload.fontSize;
    } else if (action.type === 'settings/view/font-size/set-9x9-mobile') {
        store.view.mandalaFontSize9x9Mobile = action.payload.fontSize;
    } else if (action.type === 'settings/view/font-size/set-sidebar-desktop') {
        store.view.mandalaFontSizeSidebarDesktop = action.payload.fontSize;
    } else if (action.type === 'settings/view/font-size/set-sidebar-mobile') {
        store.view.mandalaFontSizeSidebarMobile = action.payload.fontSize;
    } else if (action.type === 'settings/view/theme/set-container-bg-color') {
        store.view.theme.containerBg = action.payload.backgroundColor;
    } else if (
        action.type === 'settings/view/theme/set-active-branch-bg-color'
    ) {
        store.view.theme.activeBranchBg = action.payload.backgroundColor;
    } else if (action.type === 'settings/view/layout/set-card-width') {
        store.view.cardWidth = action.payload.width;
    } else if (action.type === 'settings/view/layout/set-min-card-height') {
        store.view.minimumCardHeight = action.payload.height;
    } else if (action.type === 'settings/view/layout/set-limit-card-height') {
        store.view.limitPreviewHeight = action.payload.limit;
    } else if (action.type === 'settings/documents/remove-stale-documents') {
        store.documents = { ...action.payload.documents };
    } else if (action.type === 'settings/view/set-zoom-level') {
        changeZoomLevel(store, action.payload);
    } else if (action.type === 'settings/general/set-default-document-format') {
        store.general.defaultDocumentFormat = action.payload.format;
    } else if (action.type === 'settings/view/toggle-minimap') {
        store.view.showMinimap = !store.view.showMinimap;
    } else if (action.type === 'view/left-sidebar/toggle') {
        store.view.showLeftSidebar = !store.view.showLeftSidebar;
    } else if (action.type === 'settings/pinned-nodes/persist') {
        const document = store.documents[action.payload.filePath];
        if (!document.pinnedSections) {
            document.pinnedSections = {
                sections: [],
                activeSection: null,
            };
        }
        document.pinnedSections.sections = action.payload.sections;
        document.pinnedSections.activeSection = action.payload.section;
    } else if (action.type === 'settings/pinned-nodes/persist-active-node') {
        const document = store.documents[action.payload.filePath];
        if (!document.pinnedSections) {
            document.pinnedSections = {
                sections: [],
                activeSection: null,
            };
        }
        document.pinnedSections.activeSection = action.payload.section;
    } else if (
        action.type === 'settings/view/toggle-horizontal-scrolling-mode'
    ) {
        store.view.scrolling.centerActiveNodeH =
            !store.view.scrolling.centerActiveNodeH;

        store.view.scrolling = {
            ...store.view.scrolling,
        };
    } else if (action.type === 'settings/view/toggle-vertical-scrolling-mode') {
        store.view.scrolling.centerActiveNodeV =
            !store.view.scrolling.centerActiveNodeV;
        store.view.scrolling = {
            ...store.view.scrolling,
        };
    } else if (action.type === 'settings/view/layout/set-cards-gap') {
        store.view.cardsGap = action.payload.gap;
    } else if (action.type === 'view/left-sidebar/set-width') {
        if (action.payload.width > 0) {
            store.view.leftSidebarWidth = action.payload.width;
        }
    } else if (action.type === 'view/left-sidebar/set-active-tab') {
        store.view.leftSidebarActiveTab = action.payload.tab;
    } else if (action.type === 'view/modes/gap-between-cards/toggle') {
        store.view.applyGapBetweenCards = !store.view.applyGapBetweenCards;
    } else if (action.type === 'settings/view/modes/toggle-outline-mode') {
        store.view.outlineMode = !store.view.outlineMode;
        if (store.view.outlineMode) {
            store.view.scrolling.centerActiveNodeH = false;
            store.view.scrolling = {
                ...store.view.scrolling,
            };
        }
        store.view.mandalaMode =
            store.view.mandalaMode === '9x9' ? '3x3' : '9x9';
    } else if (action.type === 'settings/view/mandala/toggle-mode') {
        store.view.mandalaMode =
            store.view.mandalaMode === '9x9' ? '3x3' : '9x9';
    } else if (action.type === 'view/mandala-detail-sidebar/toggle') {
        store.view.showMandalaDetailSidebar =
            !store.view.showMandalaDetailSidebar;
    } else if (action.type === 'view/mandala-detail-sidebar/set-width') {
        if (action.payload.width > 0) {
            store.view.mandalaDetailSidebarWidth = action.payload.width;
        }
    } else if (action.type === 'settings/view/set-node-indentation-width') {
        store.view.nodeIndentationWidth = action.payload.width;
    } else if (action.type === 'settings/view/set-maintain-edit-mode') {
        store.view.maintainEditMode = action.payload.maintain;
    } else if (
        action.type === 'settings/view/theme/set-inactive-node-opacity'
    ) {
        store.view.theme.inactiveNodeOpacity = action.payload.opacity;
    } else if (action.type === 'settings/view/theme/set-active-branch-color') {
        if (action.payload.color) {
            store.view.theme.activeBranchColor = action.payload.color;
        } else {
            delete store.view.theme.activeBranchColor;
        }
    } else if (action.type === 'settings/hotkeys/set-custom-hotkey') {
        const customHotkey =
            store.hotkeys.customHotkeys[action.payload.command];
        if (!customHotkey) {
            store.hotkeys.customHotkeys[action.payload.command] = {
                [action.payload.type]: action.payload.hotkey,
            };
        } else {
            customHotkey[action.payload.type] = {
                ...customHotkey[action.payload.type],
                ...action.payload.hotkey,
            };
        }
        store.hotkeys.customHotkeys = { ...store.hotkeys.customHotkeys };
    } else if (action.type === 'settings/hotkeys/reset-custom-hotkey') {
        const customHotkey =
            store.hotkeys.customHotkeys[action.payload.command];
        if (customHotkey) {
            delete customHotkey[action.payload.type];
        }
        store.hotkeys.customHotkeys = { ...store.hotkeys.customHotkeys };
    } else if (action.type === 'settings/hotkeys/apply-preset') {
        const entries = Object.entries(action.payload.preset) as [
            command: CommandName,
            hotkeys: {
                primary?: PersistedViewHotkey;
                secondary?: PersistedViewHotkey;
            },
        ][];
        for (const [command, customHotkeys] of entries) {
            if (!store.hotkeys.customHotkeys[command]) {
                store.hotkeys.customHotkeys[command] = {};
            }
            if (customHotkeys.primary) {
                store.hotkeys.customHotkeys[command]!.primary =
                    customHotkeys.primary;
            }
            if (customHotkeys.secondary) {
                store.hotkeys.customHotkeys[command]!.secondary =
                    customHotkeys.secondary;
            }
        }
        store.hotkeys.customHotkeys = {
            ...store.hotkeys.customHotkeys,
        };
    } else if (action.type === 'settings/hotkeys/reset-all') {
        store.hotkeys.customHotkeys = {};
    } else if (action.type === 'settings/hotkeys/toggle-editor-state') {
        toggleEditorState(store, action);
    } else if (action.type === 'settings/hotkeys/set-blank') {
        setHotkeyAsBlank(store, action);
    } else if (action.type === 'settings/document/persist-collapsed-sections') {
        persistCollapsedSections(store, action);
    } else if (action.type === 'settings/view/set-always-show-card-buttons') {
        store.view.alwaysShowCardButtons = action.payload.show;
    } else if (
        action.type === 'settings/view/vertical-toolbar/set-hidden-button'
    ) {
        if (action.payload.hide) {
            store.view.hiddenVerticalToolbarButtons = Array.from(
                new Set([
                    ...store.view.hiddenVerticalToolbarButtons,
                    action.payload.id,
                ]),
            );
        } else {
            store.view.hiddenVerticalToolbarButtons =
                store.view.hiddenVerticalToolbarButtons.filter(
                    (b) => b !== action.payload.id,
                );
        }
    } else if (action.type === 'settings/view/toggle-hidden-card-info') {
        store.view.showHiddenCardInfo = !store.view.showHiddenCardInfo;
    } else if (action.type === 'settings/style-rules/set-active-tab') {
        store.styleRules.settings.activeTab = action.payload.tab;
    } else if (action.type === 'settings/general/set-link-pane-type') {
        store.general.linkPaneType = action.payload.position;
    } else if (
        action.type === 'settings/general/set-mandala-templates-file-path'
    ) {
        store.general.mandalaTemplatesFilePath = action.payload.path;
    } else if (action.type === 'settings/view/set-mobile-edit-font-size-offset') {
        store.view.mobileEditFontSizeOffset = action.payload.offset;
    } else if (action.type === 'settings/view/toggle-9x9-title-only') {
        store.view.show9x9TitleOnly = !store.view.show9x9TitleOnly;
    } else if (action.type === 'settings/view/toggle-square-layout') {
        store.view.squareLayout = !store.view.squareLayout;
    } else if (action.type === 'settings/view/toggle-white-theme') {
        store.view.whiteThemeMode = !store.view.whiteThemeMode;
    } else if (action.type === 'settings/view/mandala/set-grid-orientation') {
        store.view.mandalaGridOrientation = action.payload.orientation;
    } else if (action.type === 'settings/view/mandala/toggle-a4-mode') {
        store.view.mandalaA4Mode = !store.view.mandalaA4Mode;
    } else if (action.type === 'settings/view/mandala/set-a4-orientation') {
        store.view.mandalaA4Orientation = action.payload.orientation;
    } else if (action.type === 'settings/view/mandala/set-background-mode') {
        store.view.mandalaBackgroundMode = action.payload.mode;
    } else if (action.type === 'settings/view/mandala/set-border-opacity') {
        store.view.mandalaGridBorderOpacity = action.payload.opacity;
    } else if (
        action.type === 'settings/view/mandala/set-section-color-opacity'
    ) {
        store.view.mandalaSectionColorOpacity = action.payload.opacity;
    } else if (action.type.startsWith('settings/style-rules')) {
        updateStyleRules(store, action as any);
    }
};
export const settingsReducer = (
    store: Settings,
    action: SettingsActions,
): Settings => {
    updateState(store, action);
    return store;
};
