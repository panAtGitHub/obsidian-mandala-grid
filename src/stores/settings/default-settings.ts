import { Settings } from './settings-type';

export const DEFAULT_CARD_WIDTH = 550;
export const DEFAULT_CARDS_GAP = 6;
export const DEFAULT_INDENTATION_WIDTH = 60;
export const DEFAULT_INACTIVE_NODE_OPACITY = 25;
export const DEFAULT_H1_FONT_SIZE_EM = 1.802;
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
            undo_change: {
                primary: { key: 'z', modifiers: ['Mod'] },
            },
            redo_change: {
                primary: { key: 'y', modifiers: ['Mod'] },
            },
            toggle_mandala_mode: {
                primary: { key: 'l', modifiers: ['Mod'] },
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
        showMinimap: false,
        showLeftSidebar: false,
        showMandalaDetailSidebar: false,
        mandalaDetailSidebarWidth: 350,
        leftSidebarWidth: 500,
        leftSidebarActiveTab: 'pinned-cards',
        applyGapBetweenCards: false,
        outlineMode: false,
        mandalaMode: '3x3',
        mandalaGridOrientation: 'left-to-right',
        mandalaA4Mode: false,
        mandalaA4Orientation: 'landscape',
        mandalaBackgroundMode: 'custom',
        mandalaGridBorderOpacity: 100,
        mandalaSectionColorOpacity: 100,
        nodeIndentationWidth: DEFAULT_INDENTATION_WIDTH,
        maintainEditMode: false,
        alwaysShowCardButtons: false,
        showHiddenCardInfo: true,
        show3x3SubgridNavButtonsDesktop: true,
        show3x3SubgridNavButtonsMobile: true,
        show9x9ParallelNavButtonsDesktop: true,
        show9x9ParallelNavButtonsMobile: true,
        mobileEditFontSizeOffset: 0,
        show9x9TitleOnly: false,
        squareLayout: false,
        whiteThemeMode: false,
        hiddenVerticalToolbarButtons: [],
    },
    general: {
        defaultDocumentFormat: 'sections',
        linkPaneType: 'tab',
        mandalaTemplatesFilePath: null,
    },
    styleRules: {
        documents: {},
        global: {
            rules: [],
        },
        settings: {
            activeTab: 'global-rules',
        },
    },
});
