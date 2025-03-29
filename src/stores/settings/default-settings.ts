import { Settings } from './settings-type';

export const DEFAULT_CARD_WIDTH = 550;
export const DEFAULT_CARDS_GAP = 100;
export const DEFAULT_INDENTATION_WIDTH = 60;
export const DEFAULT_INACTIVE_NODE_OPACITY = 25;
export const DEFAULT_SETTINGS = (): Settings => ({
    documents: {},
    hotkeys: {
        customHotkeys: {},
    },
    view: {
        fontSize: 16,
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
        leftSidebarWidth: 500,
        leftSidebarActiveTab: 'pinned-cards',
        applyGapBetweenCards: false,
        outlineMode: false,
        nodeIndentationWidth: DEFAULT_INDENTATION_WIDTH,
        maintainEditMode: true,
        alwaysShowCardButtons: false,
        hiddenVerticalToolbarButtons: [],
    },
    general: {
        defaultDocumentFormat: 'sections',
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
