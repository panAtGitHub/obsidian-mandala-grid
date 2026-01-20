import { Settings } from './settings-type';

export const DEFAULT_CARD_WIDTH = 550;
export const DEFAULT_CARDS_GAP = 6;
export const DEFAULT_INDENTATION_WIDTH = 60;
export const DEFAULT_INACTIVE_NODE_OPACITY = 25;
export const DEFAULT_H1_FONT_SIZE_EM = 1.802;
export const DEFAULT_SETTINGS = (): Settings => ({
    documents: {},
    hotkeys: {
        customHotkeys: {},
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
        mobileEditFontSizeOffset: 0,
        show9x9TitleOnly: false,
        squareLayout: false,
        whiteThemeMode: false,
        hiddenVerticalToolbarButtons: [],
    },
    general: {
        defaultDocumentFormat: 'sections',
        linkPaneType: 'tab',
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
