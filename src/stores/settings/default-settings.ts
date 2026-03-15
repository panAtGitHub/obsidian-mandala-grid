import { Settings } from './settings-type';
import { DEFAULT_CONTEXT_MENU_COPY_LINK_VISIBILITY } from 'src/stores/settings/helpers/context-menu-copy-link-visibility';

export const DEFAULT_CARD_WIDTH = 550;
export const DEFAULT_CARDS_GAP = 6;
export const DEFAULT_INACTIVE_NODE_OPACITY = 25;
export const DEFAULT_H1_FONT_SIZE_EM = 1.802;
export const DEFAULT_MANDALA_GRID_HIGHLIGHT_COLOR = '#418cff';
export const DEFAULT_MANDALA_GRID_HIGHLIGHT_WIDTH = 2;
export const DEFAULT_SETTINGS = (): Settings => ({
    documents: {},
    hotkeys: {
        customHotkeys: {
            save_changes_and_exit_card: {
                primary: { key: 'Escape', modifiers: [] },
            },
            enter_subgrid: {
                primary: { key: 'ArrowDown', modifiers: ['Mod'] },
            },
            exit_subgrid: {
                primary: { key: 'ArrowUp', modifiers: ['Mod'] },
            },
            toggle_search_input: {
                primary: { key: '/', modifiers: [] },
            },
            go_up: {
                primary: { key: 'ArrowUp', modifiers: [] },
            },
            go_down: {
                primary: { key: 'ArrowDown', modifiers: [] },
            },
            go_left: {
                primary: { key: 'ArrowLeft', modifiers: [] },
            },
            go_right: {
                primary: { key: 'ArrowRight', modifiers: [] },
            },
            jump_core_next: {
                primary: { key: 'ArrowRight', modifiers: ['Mod'] },
            },
            jump_core_prev: {
                primary: { key: 'ArrowLeft', modifiers: ['Mod'] },
            },
            enable_edit_mode: {
                primary: { key: 'Enter', modifiers: [] },
            },
            toggle_mandala_mode: {
                primary: { key: 'l', modifiers: ['Mod'] },
            },
            toggle_detail_sidebar: {
                primary: { key: ']', modifiers: ['Mod'] },
            },
        },
    },
    view: {
        fontSize: 16,
        h1FontSize_em: DEFAULT_H1_FONT_SIZE_EM,
        mandalaFontSize3x3Desktop: 16,
        mandalaFontSize3x3Mobile: 12,
        mandalaFontSize9x9Desktop: 11,
        mandalaFontSize9x9Mobile: 10,
        mandalaFontSizeSidebarDesktop: 16,
        mandalaFontSizeSidebarMobile: 12,
        theme: {
            inactiveNodeOpacity: DEFAULT_INACTIVE_NODE_OPACITY,
        },
        cardWidth: DEFAULT_CARD_WIDTH,
        cardsGap: DEFAULT_CARDS_GAP,
        scrolling: {
            centerActiveNodeH: false,
            centerActiveNodeV: true,
        },
        limitPreviewHeight: true,
        zoomLevel: 1,
        showLeftSidebar: false,
        showMandalaDetailSidebarDesktop: false,
        showMandalaDetailSidebarMobile: false,
        detailSidebarPreviewModeDesktop: 'rendered',
        detailSidebarPreviewModeMobile: 'rendered',
        mandalaDetailSidebarWidth: 350,
        leftSidebarWidth: 500,
        leftSidebarActiveTab: 'pinned-cards',
        applyGapBetweenCards: false,
        mandalaMode: '3x3',
        mandalaGridOrientation: 'left-to-right',
        mandalaGridSelectedLayoutId: 'builtin:left-to-right',
        mandalaGridCustomLayouts: [],
        mandalaA4Mode: false,
        mandalaA4Orientation: 'landscape',
        mandalaBackgroundMode: 'custom',
        mandalaGridBorderOpacity: 100,
        mandalaGridHighlightWidth: DEFAULT_MANDALA_GRID_HIGHLIGHT_WIDTH,
        mandalaSectionColorOpacity: 100,
        lastExportPreset: null,
        alwaysShowCardButtons: false,
        showHiddenCardInfo: true,
        show3x3SubgridNavButtonsDesktop: true,
        show3x3SubgridNavButtonsMobile: true,
        show9x9ParallelNavButtonsDesktop: true,
        show9x9ParallelNavButtonsMobile: true,
        contextMenuCopyLinkVisibilityDesktop: {
            ...DEFAULT_CONTEXT_MENU_COPY_LINK_VISIBILITY,
        },
        contextMenuCopyLinkVisibilityMobile: {
            ...DEFAULT_CONTEXT_MENU_COPY_LINK_VISIBILITY,
        },
        mobileEditFontSizeOffset: 0,
        show9x9TitleOnly: false,
        squareLayout: false,
        whiteThemeMode: false,
        mandalaEmbedDebug: false,
        hiddenVerticalToolbarButtons: [],
    },
    general: {
        linkPaneType: 'tab',
        mandalaTemplatesFilePath: null,
        dayPlanEnabled: true,
    },
});
