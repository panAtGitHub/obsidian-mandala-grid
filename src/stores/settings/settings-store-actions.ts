import {
    ContextMenuCopyLinkVariant,
    CustomHotkeys,
    DayPlanDateHeadingApplyMode,
    DayPlanDateHeadingFormat,
    DetailSidebarPreviewMode,
    DocumentPreferences,
    LeftSidebarTab,
    MandalaCustomLayout,
    MandalaGridOrientation,
    MandalaMode,
    MandalaSectionColorAssignments,
    LinkPaneType,
    ViewType,
    WeekStart,
} from 'src/stores/settings/settings-type';
import { ChangeZoomLevelAction } from 'src/stores/settings/reducers/change-zoom-level';
import { ToolbarButton } from 'src/view/modals/vertical-toolbar-buttons/vertical-toolbar-buttons';
import { CommandName } from 'src/lang/hotkey-groups';
import { Hotkey } from 'obsidian';

export type SettingsActions =
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
          type: 'settings/view/font-size/set-7x9-desktop';
          payload: { fontSize: number };
      }
    | {
          type: 'settings/view/font-size/set-7x9-mobile';
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
    | PersistMandalaViewStateAction
    | PersistMandalaPinnedSectionsAction
    | PersistMandalaSectionColorsAction
    | {
          type: 'view/left-sidebar/toggle';
      }
    | { type: 'view/left-sidebar/set-width'; payload: { width: number } }
    | {
          type: 'view/left-sidebar/set-active-tab';
          payload: { tab: LeftSidebarTab };
      }
    | { type: 'view/modes/gap-between-cards/toggle' }
    | { type: 'settings/view/mandala/toggle-mode' }
    | {
          type: 'settings/view/mandala/set-mode';
          payload: {
              mode: MandalaMode;
          };
      }
    | { type: 'view/mandala-detail-sidebar/toggle' }
    | {
          type: 'view/mandala-detail-sidebar/set-width';
          payload: { width: number };
      }
    | {
          type: 'settings/view/toggle-hidden-card-info';
      }
    | {
          type: 'settings/view/detail-sidebar/set-preview-mode';
          payload: {
              mode: DetailSidebarPreviewMode;
          };
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
          type: 'settings/view/toggle-day-plan-today-button-desktop';
      }
    | {
          type: 'settings/view/toggle-day-plan-today-button-mobile';
      }
    | {
          type: 'settings/view/context-menu-copy-link/set-visibility';
          payload: {
              variant: ContextMenuCopyLinkVariant;
              visible: boolean;
          };
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
    | {
          type: 'settings/view/set-always-show-card-buttons';
          payload: {
              show: boolean;
          };
      }
    | {
          type: 'settings/view/set-mandala-embed-debug';
          payload: {
              enabled: boolean;
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
          type: 'settings/general/set-day-plan-enabled';
          payload: {
              enabled: boolean;
          };
      }
    | {
          type: 'settings/general/set-week-plan-enabled';
          payload: {
              enabled: boolean;
          };
      }
    | {
          type: 'settings/general/set-week-plan-compact-mode';
          payload: {
              enabled: boolean;
          };
      }
    | {
          type: 'settings/general/set-week-start';
          payload: {
              weekStart: WeekStart;
          };
      }
    | {
          type: 'settings/general/set-day-plan-date-heading-format';
          payload: {
              format: DayPlanDateHeadingFormat;
          };
      }
    | {
          type: 'settings/general/set-day-plan-date-heading-custom-template';
          payload: {
              template: string;
          };
      }
    | {
          type: 'settings/general/set-day-plan-date-heading-apply-mode';
          payload: {
              mode: DayPlanDateHeadingApplyMode;
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
          type: 'settings/view/mandala/select-grid-layout';
          payload: { layoutId: string };
      }
    | {
          type: 'settings/view/mandala/add-custom-grid-layout';
          payload: { layout: MandalaCustomLayout };
      }
    | {
          type: 'settings/view/mandala/create-custom-grid-layout';
          payload: { layout: MandalaCustomLayout };
      }
    | {
          type: 'settings/view/mandala/update-custom-grid-layout';
          payload: { id: string; name: string; pattern: string };
      }
    | {
          type: 'settings/view/mandala/delete-custom-grid-layout';
          payload: { id: string };
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
          type: 'settings/view/mandala/set-grid-highlight-color';
          payload: { color: string | undefined };
      }
    | {
          type: 'settings/view/mandala/set-grid-highlight-width';
          payload: { width: number };
      }
    | {
          type: 'settings/view/mandala/set-section-color-opacity';
          payload: { opacity: number };
      }
    | {
          type: 'settings/view/mandala/set-last-export-preset';
          payload: {
              preset: {
                  exportMode: 'png-square' | 'png-screen' | 'pdf-a4';
                  includeSidebar: boolean;
                  a4Orientation: 'portrait' | 'landscape';
                  backgroundMode: 'none' | 'custom' | 'gray';
                  sectionColorOpacity: number;
                  borderOpacity: number;
                  gridHighlightColor?: string;
                  gridHighlightWidth?: number;
                  whiteThemeMode: boolean;
                  squareLayout: boolean;
              } | null;
          };
      };
export type PersistActiveNodeAction = {
    type: 'settings/document/persist-active-section';
    payload: {
        path: string;
        sectionNumber: string;
    };
};
export type PersistMandalaViewStateAction = {
    type: 'settings/documents/persist-mandala-view-state';
    payload: {
        path: string;
        gridOrientation: MandalaGridOrientation;
        selectedLayoutId: string | null;
        selectedCustomLayout?: MandalaCustomLayout | null;
        lastActiveSection: string | null;
        subgridTheme: string | null;
        showDetailSidebarDesktop: boolean | null;
        showDetailSidebarMobile: boolean | null;
    };
};
export type PersistMandalaPinnedSectionsAction = {
    type: 'settings/documents/persist-mandala-pinned-sections';
    payload: {
        path: string;
        sections: string[];
    };
};
export type PersistMandalaSectionColorsAction = {
    type: 'settings/documents/persist-mandala-section-colors';
    payload: {
        path: string;
        map: MandalaSectionColorAssignments;
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
