import { Settings } from './settings-type';
import { changeZoomLevel } from 'src/stores/settings/reducers/change-zoom-level';
import { updateStyleRules } from 'src/stores/settings/reducers/update-style-rules/update-style-rules';
import { CommandName } from 'src/lang/hotkey-groups';
import { toggleEditorState } from 'src/stores/settings/reducers/toggle-editor-state';
import { setHotkeyAsBlank } from 'src/stores/settings/reducers/set-hotkey-as-blank';
import { PersistedViewHotkey } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import { persistCollapsedSections } from 'src/stores/settings/reducers/persist-collapsed-sections';
import { SettingsActions } from 'src/stores/settings/settings-store-actions';

type SettingsActionHandler = (store: Settings, action: SettingsActions) => void;

const settingsHandlers: Record<string, SettingsActionHandler> = {
    'settings/documents/delete-document-preferences': (store, action) => {
        if (action.type !== 'settings/documents/delete-document-preferences')
            return;
        delete store.documents[action.payload.path];
        delete store.styleRules.documents[action.payload.path];
    },
    'settings/documents/set-document-format': (store, action) => {
        if (action.type !== 'settings/documents/set-document-format') return;
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
            return;
        }
        store.documents[action.payload.path].documentFormat =
            action.payload.format;
    },
    'settings/documents/set-view-type': (store, action) => {
        if (action.type !== 'settings/documents/set-view-type') return;
        if (store.documents[action.payload.path]) {
            store.documents[action.payload.path].viewType = action.payload.type;
        }
    },
    'settings/document/persist-active-section': (store, action) => {
        if (action.type !== 'settings/document/persist-active-section') return;
        if (store.documents[action.payload.path]) {
            store.documents[action.payload.path].activeSection =
                action.payload.sectionNumber;
        }
    },
    'settings/documents/update-document-path': (store, action) => {
        if (action.type !== 'settings/documents/update-document-path') return;
        const preferences = store.documents[action.payload.oldPath];
        delete store.documents[action.payload.oldPath];
        store.documents[action.payload.newPath] = preferences;

        if (store.styleRules.documents[action.payload.oldPath]) {
            const rules = store.styleRules.documents[action.payload.oldPath];
            delete store.styleRules.documents[action.payload.oldPath];
            store.styleRules.documents[action.payload.newPath] = rules;
        }
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
    'settings/general/set-default-document-format': (store, action) => {
        if (action.type !== 'settings/general/set-default-document-format')
            return;
        store.general.defaultDocumentFormat = action.payload.format;
    },
    'settings/view/toggle-minimap': (store, action) => {
        if (action.type !== 'settings/view/toggle-minimap') return;
        store.view.showMinimap = !store.view.showMinimap;
    },
    'view/left-sidebar/toggle': (store, action) => {
        if (action.type !== 'view/left-sidebar/toggle') return;
        store.view.showLeftSidebar = !store.view.showLeftSidebar;
    },
    'settings/pinned-nodes/persist': (store, action) => {
        if (action.type !== 'settings/pinned-nodes/persist') return;
        const document = store.documents[action.payload.filePath];
        if (!document.pinnedSections) {
            document.pinnedSections = {
                sections: [],
                activeSection: null,
            };
        }
        document.pinnedSections.sections = action.payload.sections;
        document.pinnedSections.activeSection = action.payload.section;
    },
    'settings/pinned-nodes/persist-active-node': (store, action) => {
        if (action.type !== 'settings/pinned-nodes/persist-active-node') return;
        const document = store.documents[action.payload.filePath];
        if (!document.pinnedSections) {
            document.pinnedSections = {
                sections: [],
                activeSection: null,
            };
        }
        document.pinnedSections.activeSection = action.payload.section;
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
        store.view.leftSidebarActiveTab = action.payload.tab;
    },
    'view/modes/gap-between-cards/toggle': (store, action) => {
        if (action.type !== 'view/modes/gap-between-cards/toggle') return;
        store.view.applyGapBetweenCards = !store.view.applyGapBetweenCards;
    },
    'settings/view/modes/toggle-outline-mode': (store, action) => {
        if (action.type !== 'settings/view/modes/toggle-outline-mode') return;
        store.view.outlineMode = !store.view.outlineMode;
        if (store.view.outlineMode) {
            store.view.scrolling.centerActiveNodeH = false;
            store.view.scrolling = {
                ...store.view.scrolling,
            };
        }
        store.view.mandalaMode =
            store.view.mandalaMode === '9x9' ? '3x3' : '9x9';
    },
    'settings/view/mandala/toggle-mode': (store, action) => {
        if (action.type !== 'settings/view/mandala/toggle-mode') return;
        store.view.mandalaMode =
            store.view.mandalaMode === '9x9' ? '3x3' : '9x9';
    },
    'view/mandala-detail-sidebar/toggle': (store, action) => {
        if (action.type !== 'view/mandala-detail-sidebar/toggle') return;
        store.view.showMandalaDetailSidebar =
            !store.view.showMandalaDetailSidebar;
    },
    'view/mandala-detail-sidebar/set-width': (store, action) => {
        if (action.type !== 'view/mandala-detail-sidebar/set-width') return;
        if (action.payload.width > 0) {
            store.view.mandalaDetailSidebarWidth = action.payload.width;
        }
    },
    'settings/view/set-node-indentation-width': (store, action) => {
        if (action.type !== 'settings/view/set-node-indentation-width') return;
        store.view.nodeIndentationWidth = action.payload.width;
    },
    'settings/view/set-maintain-edit-mode': (store, action) => {
        if (action.type !== 'settings/view/set-maintain-edit-mode') return;
        store.view.maintainEditMode = action.payload.maintain;
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
    'settings/document/persist-collapsed-sections': (store, action) => {
        if (action.type !== 'settings/document/persist-collapsed-sections')
            return;
        persistCollapsedSections(store, action);
    },
    'settings/view/set-always-show-card-buttons': (store, action) => {
        if (action.type !== 'settings/view/set-always-show-card-buttons')
            return;
        store.view.alwaysShowCardButtons = action.payload.show;
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
    'settings/style-rules/set-active-tab': (store, action) => {
        if (action.type !== 'settings/style-rules/set-active-tab') return;
        store.styleRules.settings.activeTab = action.payload.tab;
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
    'settings/view/mandala/set-section-color-opacity': (store, action) => {
        if (action.type !== 'settings/view/mandala/set-section-color-opacity')
            return;
        store.view.mandalaSectionColorOpacity = action.payload.opacity;
    },
};

const updateState = (store: Settings, action: SettingsActions) => {
    if (action.type.startsWith('settings/style-rules')) {
        updateStyleRules(
            store,
            action as Parameters<typeof updateStyleRules>[1],
        );
        return;
    }

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
