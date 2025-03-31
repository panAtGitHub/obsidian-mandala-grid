import {
    CustomHotkeys,
    DocumentPreferences,
    LeftSidebarTab,
    LineageDocumentFormat,
    RulesTab,
    Settings,
    ViewType,
} from './settings-type';
import {
    changeZoomLevel,
    ChangeZoomLevelAction,
} from 'src/stores/settings/reducers/change-zoom-level';
import {
    StyleRulesAction,
    updateStyleRules,
} from 'src/stores/settings/reducers/update-style-rules/update-style-rules';
import { Hotkey } from 'obsidian';
import { CommandName } from 'src/lang/hotkey-groups';
import { toggleEditorState } from 'src/stores/settings/reducers/toggle-editor-state';
import { setHotkeyAsBlank } from 'src/stores/settings/reducers/set-hotkey-as-blank';
import { PersistedViewHotkey } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import { persistCollapsedSections } from 'src/stores/settings/reducers/persist-collapsed-sections';
import { ToolbarButton } from 'src/view/modals/vertical-toolbar-buttons/vertical-toolbar-buttons';

export type SettingsActions =
    | {
          type: 'SET_DOCUMENT_TYPE';
          payload: {
              path: string;
              format: LineageDocumentFormat;
          };
      }
    | {
          type: 'SET_VIEW_TYPE';
          payload: {
              path: string;
              type: ViewType;
          };
      }
    | {
          type: 'DELETE_DOCUMENT_PREFERENCES';
          payload: {
              path: string;
          };
      }
    | {
          type: 'HISTORY/UPDATE_DOCUMENT_PATH';
          payload: {
              oldPath: string;
              newPath: string;
          };
      }
    | {
          type: 'SET_CUSTOM_HOTKEYS';
          payload: {
              customHotkeys: CustomHotkeys;
          };
      }
    | {
          type: 'SET_FONT_SIZE';
          payload: {
              fontSize: number;
          };
      }
    | {
          type: 'settings/view/set-h1-font-size';
          payload: {
              fontSize_em: number;
          };
      }
    | {
          type: 'SET_CONTAINER_BG';
          payload: {
              backgroundColor: string | undefined;
          };
      }
    | {
          type: 'SET_ACTIVE_BRANCH_BG';
          payload: {
              backgroundColor: string | undefined;
          };
      }
    | {
          type: 'SET_CARD_WIDTH';
          payload: {
              width: number;
          };
      }
    | {
          type: 'SET_CARDS_GAP';
          payload: { gap: number };
      }
    | {
          type: 'SET_MIN_CARD_HEIGHT';
          payload: {
              height: number | undefined;
          };
      }
    | {
          type: 'VIEW/SCROLLING/TOGGLE_SCROLLING_MODE';
      }
    | {
          type: 'settings/view/scrolling/toggle-vertical-scrolling-mode';
      }
    | {
          type: 'SET_LIMIT_PREVIEW_HEIGHT';
          payload: {
              limit: boolean;
          };
      }
    | {
          type: 'UPDATE_DOCUMENTS_DICTIONARY';
          payload: {
              documents: Record<string, DocumentPreferences>;
          };
      }
    | ChangeZoomLevelAction
    | PersistActiveNodeAction
    | {
          type: 'GENERAL/SET_DEFAULT_DOCUMENT_FORMAT';
          payload: {
              format: LineageDocumentFormat;
          };
      }
    | {
          type: 'VIEW/TOGGLE_MINIMAP';
      }
    | {
          type: 'view/left-sidebar/toggle';
      }
    | { type: 'view/left-sidebar/set-width'; payload: { width: number } }
    | {
          type: 'view/left-sidebar/set-active-tab';
          payload: { tab: LeftSidebarTab };
      }
    | {
          type: 'settings/pinned-nodes/persist';
          payload: {
              filePath: string;
              sections: string[];
              section: string;
          };
      }
    | {
          type: 'settings/pinned-nodes/persist-active-node';
          payload: {
              filePath: string;
              section: string;
          };
      }
    | { type: 'view/modes/gap-between-cards/toggle' }
    | { type: 'settings/view/modes/toggle-outline-mode' }
    | {
          type: 'settings/style-rules/set-active-tab';
          payload: { tab: RulesTab };
      }
    | StyleRulesAction
    | {
          type: 'settings/view/set-node-indentation-width';
          payload: {
              width: number;
          };
      }
    | {
          type: 'settings/view/set-maintain-edit-mode';
          payload: { maintain: boolean };
      }
    | {
          type: 'settings/view/theme/set-inactive-node-opacity';
          payload: { opacity: number };
      }
    | {
          type: 'settings/view/theme/set-active-branch-color';
          payload: { color: string | undefined };
      }
    | HotkeySettingsActions
    | PersistCollapsedSectionsAction
    | {
          type: 'settings/view/set-always-show-card-buttons';
          payload: {
              show: boolean;
          };
      }
    | {
          type: 'settings/view/vertical-toolbar/set-hidden-button';
          payload: {
              id: ToolbarButton;
              hide: boolean;
          };
      };

export type PersistCollapsedSectionsAction = {
    type: 'settings/document/persist-collapsed-sections';
    payload: {
        path: string;
        sections: string[];
    };
};
export type PersistActiveNodeAction = {
    type: 'settings/document/persist-active-section';
    payload: {
        path: string;
        sectionNumber: string;
    };
};

export type ToggleEditorStateAction = {
    type: 'settings/hotkeys/toggle-editor-state';
    payload: { command: CommandName; type: 'primary' | 'secondary' };
};

export type SetHotkeyBlankAction = {
    type: 'settings/hotkeys/set-blank';
    payload: {
        command: CommandName;
        type: 'primary' | 'secondary';
    };
};
export type HotkeySettingsActions =
    | UpdateHotkeyAction
    | ResetHotkeyAction
    | {
          type: 'settings/hotkeys/reset-all';
      }
    | {
          type: 'settings/hotkeys/apply-preset';
          payload: { preset: CustomHotkeys };
      }
    | ToggleEditorStateAction
    | SetHotkeyBlankAction;

export type UpdateHotkeyAction = {
    type: 'settings/hotkeys/set-custom-hotkey';
    payload: {
        hotkey: Hotkey;
        command: CommandName;
        type: 'primary' | 'secondary';
    };
};
export type ResetHotkeyAction = {
    type: 'settings/hotkeys/reset-custom-hotkey';
    payload: {
        command: CommandName;
        type: 'primary' | 'secondary';
    };
};

const updateState = (store: Settings, action: SettingsActions) => {
    if (action.type === 'DELETE_DOCUMENT_PREFERENCES') {
        delete store.documents[action.payload.path];
        delete store.styleRules.documents[action.payload.path];
    } else if (action.type === 'SET_DOCUMENT_TYPE') {
        if (!store.documents[action.payload.path]) {
            store.documents[action.payload.path] = {
                documentFormat: action.payload.format,
                viewType: 'lineage',
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
    } else if (action.type === 'SET_VIEW_TYPE') {
        if (store.documents[action.payload.path]) {
            store.documents[action.payload.path].viewType = action.payload.type;
        }
    } else if (action.type === 'settings/document/persist-active-section') {
        if (store.documents[action.payload.path]) {
            store.documents[action.payload.path].activeSection =
                action.payload.sectionNumber;
        }
    } else if (action.type === 'HISTORY/UPDATE_DOCUMENT_PATH') {
        const preferences = store.documents[action.payload.oldPath];
        delete store.documents[action.payload.oldPath];
        store.documents[action.payload.newPath] = preferences;

        if (store.styleRules.documents[action.payload.oldPath]) {
            const rules = store.styleRules.documents[action.payload.oldPath];
            delete store.styleRules.documents[action.payload.oldPath];
            store.styleRules.documents[action.payload.newPath] = rules;
        }
    } else if (action.type === 'SET_CUSTOM_HOTKEYS') {
        store.hotkeys.customHotkeys = action.payload.customHotkeys;
    } else if (action.type === 'SET_FONT_SIZE') {
        store.view.fontSize = action.payload.fontSize;
    } else if (action.type === 'settings/view/set-h1-font-size') {
        store.view.h1FontSize_em = action.payload.fontSize_em;
    } else if (action.type === 'SET_CONTAINER_BG') {
        store.view.theme.containerBg = action.payload.backgroundColor;
    } else if (action.type === 'SET_ACTIVE_BRANCH_BG') {
        store.view.theme.activeBranchBg = action.payload.backgroundColor;
    } else if (action.type === 'SET_CARD_WIDTH') {
        store.view.cardWidth = action.payload.width;
    } else if (action.type === 'SET_MIN_CARD_HEIGHT') {
        store.view.minimumCardHeight = action.payload.height;
    } else if (action.type === 'SET_LIMIT_PREVIEW_HEIGHT') {
        store.view.limitPreviewHeight = action.payload.limit;
    } else if (action.type === 'UPDATE_DOCUMENTS_DICTIONARY') {
        store.documents = action.payload.documents;
    } else if (action.type === 'UI/CHANGE_ZOOM_LEVEL') {
        changeZoomLevel(store, action.payload);
    } else if (action.type === 'GENERAL/SET_DEFAULT_DOCUMENT_FORMAT') {
        store.general.defaultDocumentFormat = action.payload.format;
    } else if (action.type === 'VIEW/TOGGLE_MINIMAP') {
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
    } else if (action.type === 'VIEW/SCROLLING/TOGGLE_SCROLLING_MODE') {
        store.view.scrolling.centerActiveNodeH =
            !store.view.scrolling.centerActiveNodeH;

        store.view.scrolling = {
            ...store.view.scrolling,
        };
    } else if (
        action.type === 'settings/view/scrolling/toggle-vertical-scrolling-mode'
    ) {
        store.view.scrolling.centerActiveNodeV =
            !store.view.scrolling.centerActiveNodeV;
        store.view.scrolling = {
            ...store.view.scrolling,
        };
    } else if (action.type === 'SET_CARDS_GAP') {
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
    } else if (action.type === 'settings/style-rules/set-active-tab') {
        store.styleRules.settings.activeTab = action.payload.tab;
    } else if (action.type.startsWith('settings/style-rules')) {
        updateStyleRules(store, action);
    }
};
export const settingsReducer = (
    store: Settings,
    action: SettingsActions,
): Settings => {
    updateState(store, action);
    return store;
};
