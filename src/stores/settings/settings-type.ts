import { CommandName } from 'src/lang/hotkey-groups';
import { StyleRule } from 'src/stores/settings/types/style-rules-types';
import { PersistedViewHotkey } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import { ToolbarButton } from 'src/view/modals/vertical-toolbar-buttons/vertical-toolbar-buttons';

export type CustomHotkeys = {
    [command in CommandName]?: {
        primary?: PersistedViewHotkey;
        secondary?: PersistedViewHotkey;
    };
};
export type Theme = {
    containerBg?: string;
    activeBranchBg?: string;
    activeBranchColor?: string;
    inactiveNodeOpacity: number;
};

export type ScrollingSettings = {
    centerActiveNodeH: boolean;
    centerActiveNodeV: boolean;
};

export type MandalaGridDocumentFormat = 'outline' | 'sections' | 'html-element';

export type ViewType = 'mandala-grid' | 'markdown';

export type MandalaMode = '3x3' | '9x9';
export type MandalaGridOrientation =
    | 'south-start'
    | 'left-to-right'
    | 'bottom-to-top';

export type DocumentPreferences = {
    documentFormat: MandalaGridDocumentFormat;
    viewType: ViewType;
    activeSection: string | null;
    pinnedSections: {
        sections: string[];
        activeSection: string | null;
    } | null;
    outline: {
        collapsedSections: string[];
    } | null;
};

export type LeftSidebarTab = 'pinned-cards' | 'recent-cards';

export type RulesTab = 'global-rules' | 'document-rules';

export type LinkPaneType = 'split' | 'tab';
export type DocumentsPreferences = Record<string, DocumentPreferences>;
export type Settings = {
    documents: DocumentsPreferences;
    hotkeys: {
        customHotkeys: CustomHotkeys;
    };
    view: {
        fontSize: number;
        h1FontSize_em: number;
        mandalaFontSize3x3Desktop: number;
        mandalaFontSize3x3Mobile: number;
        mandalaFontSize9x9Desktop: number;
        mandalaFontSize9x9Mobile: number;
        mandalaFontSizeSidebarDesktop: number;
        mandalaFontSizeSidebarMobile: number;
        theme: Theme;
        cardWidth: number;
        cardsGap: number;
        minimumCardHeight?: number;
        scrolling: ScrollingSettings;
        limitPreviewHeight: boolean;
        zoomLevel: number;
        showMinimap: boolean;
        showLeftSidebar: boolean;
        showMandalaDetailSidebar: boolean;
        mandalaDetailSidebarWidth: number;
        leftSidebarWidth: number;
        leftSidebarActiveTab: LeftSidebarTab;
        applyGapBetweenCards: boolean;
        outlineMode: boolean;
        mandalaMode: MandalaMode;
        mandalaGridOrientation: MandalaGridOrientation;
        mandalaA4Mode: boolean;
        mandalaA4Orientation: 'portrait' | 'landscape';
        mandalaBackgroundMode: 'none' | 'custom' | 'gray';
        mandalaGridBorderOpacity: number;
        mandalaSectionColorOpacity: number;
        nodeIndentationWidth: number;
        maintainEditMode: boolean;
        alwaysShowCardButtons: boolean;
        showHiddenCardInfo: boolean;
        show3x3SubgridNavButtonsDesktop: boolean;
        show3x3SubgridNavButtonsMobile: boolean;
        show9x9ParallelNavButtonsDesktop: boolean;
        show9x9ParallelNavButtonsMobile: boolean;
        mobileEditFontSizeOffset: number;
        show9x9TitleOnly: boolean;
        squareLayout: boolean;
        whiteThemeMode: boolean;
        hiddenVerticalToolbarButtons: ToolbarButton[];
    };
    general: {
        defaultDocumentFormat: MandalaGridDocumentFormat;
        linkPaneType: LinkPaneType;
        mandalaTemplatesFilePath: string | null;
    };
    styleRules: {
        documents: { [path: string]: { rules: StyleRule[] } };
        global: {
            rules: StyleRule[];
        };
        settings: {
            activeTab: RulesTab;
        };
    };
};
