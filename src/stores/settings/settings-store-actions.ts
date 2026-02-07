import {
    CustomHotkeys,
    DocumentPreferences,
    LeftSidebarTab,
    MandalaGridDocumentFormat,
    MandalaGridOrientation,
    LinkPaneType,
    RulesTab,
    ViewType,
} from 'src/stores/settings/settings-type';
import { ChangeZoomLevelAction } from 'src/stores/settings/reducers/change-zoom-level';
import { StyleRulesAction } from 'src/stores/settings/reducers/update-style-rules/update-style-rules';
import { ToolbarButton } from 'src/view/modals/vertical-toolbar-buttons/vertical-toolbar-buttons';
import { CommandName } from 'src/lang/hotkey-groups';
import { Hotkey } from 'obsidian';

export type SettingsActions =
    | {
          type: 'settings/documents/set-document-format';
          payload: {
              path: string;
              format: MandalaGridDocumentFormat;
          };
      }
    | {
          type: 'settings/documents/set-view-type';
          payload: {
              path: string;
              type: ViewType;
          };
      }
    | {
          type: 'settings/documents/delete-document-preferences';
          payload: {
              path: string;
          };
      }
    | {
          type: 'settings/documents/update-document-path';
          payload: {
              oldPath: string;
              newPath: string;
          };
      }
    | {
          type: 'settings/hotkeys/update-custom-hotkeys';
          payload: {
              customHotkeys: CustomHotkeys;
          };
      }
    | {
          type: 'settings/view/theme/set-font-size';
          payload: {
              fontSize: number;
          };
      }
    | {
          type: 'settings/view/theme/set-h1-font-size';
          payload: {
              fontSize_em: number;
          };
      }
    | {
          type: 'settings/view/font-size/set-3x3-desktop';
          payload: { fontSize: number };
      }
    | {
          type: 'settings/view/font-size/set-3x3-mobile';
          payload: { fontSize: number };
      }
    | {
          type: 'settings/view/font-size/set-9x9-desktop';
          payload: { fontSize: number };
      }
    | {
          type: 'settings/view/font-size/set-9x9-mobile';
          payload: { fontSize: number };
      }
    | {
          type: 'settings/view/font-size/set-sidebar-desktop';
          payload: { fontSize: number };
      }
    | {
          type: 'settings/view/font-size/set-sidebar-mobile';
          payload: { fontSize: number };
      }
    | {
          type: 'settings/view/theme/set-container-bg-color';
          payload: {
              backgroundColor: string | undefined;
          };
      }
    | {
          type: 'settings/view/theme/set-active-branch-bg-color';
          payload: {
              backgroundColor: string | undefined;
          };
      }
    | {
          type: 'settings/view/layout/set-card-width';
          payload: {
              width: number;
          };
      }
    | {
          type: 'settings/view/layout/set-cards-gap';
          payload: { gap: number };
      }
    | {
          type: 'settings/view/layout/set-min-card-height';
          payload: {
              height: number | undefined;
          };
      }
    | {
          type: 'settings/view/toggle-horizontal-scrolling-mode';
      }
    | {
          type: 'settings/view/toggle-vertical-scrolling-mode';
      }
    | {
          type: 'settings/view/layout/set-limit-card-height';
          payload: {
              limit: boolean;
          };
      }
    | {
          type: 'settings/documents/remove-stale-documents';
          payload: {
              documents: Record<string, DocumentPreferences>;
          };
      }
    | ChangeZoomLevelAction
    | PersistActiveNodeAction
    | {
          type: 'settings/general/set-default-document-format';
          payload: {
              format: MandalaGridDocumentFormat;
          };
      }
    | {
          type: 'settings/view/toggle-minimap';
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
              section: string | null;
          };
      }
    | {
          type: 'settings/pinned-nodes/persist-active-node';
          payload: {
              filePath: string;
              section: string | null;
          };
      }
    | { type: 'view/modes/gap-between-cards/toggle' }
    | { type: 'settings/view/modes/toggle-outline-mode' }
    | { type: 'settings/view/mandala/toggle-mode' }
    | { type: 'view/mandala-detail-sidebar/toggle' }
    | {
          type: 'view/mandala-detail-sidebar/set-width';
          payload: { width: number };
      }
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
          type: 'settings/view/toggle-hidden-card-info';
      }
    | {
          type: 'settings/view/toggle-3x3-subgrid-nav-buttons-desktop';
      }
    | {
          type: 'settings/view/toggle-3x3-subgrid-nav-buttons-mobile';
      }
    | {
          type: 'settings/view/toggle-9x9-parallel-nav-buttons-desktop';
      }
    | {
          type: 'settings/view/toggle-9x9-parallel-nav-buttons-mobile';
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
      }
    | {
          type: 'settings/general/set-link-pane-type';
          payload: {
              position: LinkPaneType;
          };
      }
    | {
          type: 'settings/general/set-mandala-templates-file-path';
          payload: {
              path: string | null;
          };
      }
    | {
          type: 'settings/view/set-mobile-edit-font-size-offset';
          payload: {
              offset: number;
          };
      }
    | {
          type: 'settings/view/toggle-9x9-title-only';
      }
    | {
          type: 'settings/view/toggle-square-layout';
      }
    | {
          type: 'settings/view/toggle-white-theme';
      }
    | {
          type: 'settings/view/mandala/set-grid-orientation';
          payload: { orientation: MandalaGridOrientation };
      }
    | {
          type: 'settings/view/mandala/toggle-a4-mode';
      }
    | {
          type: 'settings/view/mandala/set-a4-orientation';
          payload: { orientation: 'portrait' | 'landscape' };
      }
    | {
          type: 'settings/view/mandala/set-background-mode';
          payload: { mode: 'none' | 'custom' | 'gray' };
      }
    | {
          type: 'settings/view/mandala/set-border-opacity';
          payload: { opacity: number };
      }
    | {
          type: 'settings/view/mandala/set-section-color-opacity';
          payload: { opacity: number };
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
