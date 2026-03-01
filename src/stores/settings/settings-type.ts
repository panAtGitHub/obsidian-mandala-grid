import { CommandName } from 'src/lang/hotkey-groups';
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

export type ViewType = 'mandala-grid' | 'markdown';
export type DetailSidebarPreviewMode = 'rendered' | 'source';

export type MandalaMode = '3x3' | '9x9';
export type MandalaGridOrientation =
    | 'south-start'
    | 'left-to-right'
    | 'bottom-to-top';
export type MandalaSectionColorAssignments = Partial<Record<string, string[]>>;
export type MandalaViewDocumentPreferences = {
    gridOrientation: MandalaGridOrientation | null;
    lastActiveSection: string | null;
    subgridTheme: string | null;
    pinnedSections: string[];
    sectionColors: MandalaSectionColorAssignments;
};
export type MandalaExportMode = 'png-square' | 'png-screen' | 'pdf-a4';
export type LastExportPreset = {
    exportMode: MandalaExportMode;
    includeSidebar: boolean;
    a4Orientation: 'portrait' | 'landscape';
    backgroundMode: 'none' | 'custom' | 'gray';
    sectionColorOpacity: number;
    borderOpacity: number;
    whiteThemeMode: boolean;
    squareLayout: boolean;
};

export type DocumentPreferences = {
    viewType: ViewType;
    activeSection: string | null;
    outline: {
        collapsedSections: string[];
    } | null;
    mandalaView: MandalaViewDocumentPreferences;
};

export type LeftSidebarTab = 'pinned-cards';

export type LinkPaneType = 'split' | 'tab';
export type ContextMenuCopyLinkVariant =
    | 'block-plain'
    | 'block-embed'
    | 'heading-plain'
    | 'heading-embed'
    | 'heading-embed-dollar';
export type ContextMenuCopyLinkVisibility = Record<
    ContextMenuCopyLinkVariant,
    boolean
>;
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
        showLeftSidebar: boolean;
        showMandalaDetailSidebarDesktop: boolean;
        showMandalaDetailSidebarMobile: boolean;
        detailSidebarPreviewModeDesktop: DetailSidebarPreviewMode;
        detailSidebarPreviewModeMobile: DetailSidebarPreviewMode;
        mandalaDetailSidebarWidth: number;
        leftSidebarWidth: number;
        leftSidebarActiveTab: LeftSidebarTab;
        applyGapBetweenCards: boolean;
        mandalaMode: MandalaMode;
        mandalaGridOrientation: MandalaGridOrientation;
        mandalaA4Mode: boolean;
        mandalaA4Orientation: 'portrait' | 'landscape';
        mandalaBackgroundMode: 'none' | 'custom' | 'gray';
        mandalaGridBorderOpacity: number;
        mandalaSectionColorOpacity: number;
        lastExportPreset: LastExportPreset | null;
        alwaysShowCardButtons: boolean;
        showHiddenCardInfo: boolean;
        show3x3SubgridNavButtonsDesktop: boolean;
        show3x3SubgridNavButtonsMobile: boolean;
        show9x9ParallelNavButtonsDesktop: boolean;
        show9x9ParallelNavButtonsMobile: boolean;
        contextMenuCopyLinkVisibilityDesktop: ContextMenuCopyLinkVisibility;
        contextMenuCopyLinkVisibilityMobile: ContextMenuCopyLinkVisibility;
        mobileEditFontSizeOffset: number;
        show9x9TitleOnly: boolean;
        squareLayout: boolean;
        whiteThemeMode: boolean;
        mandalaEmbedDebug: boolean;
        hiddenVerticalToolbarButtons: ToolbarButton[];
    };
    general: {
        linkPaneType: LinkPaneType;
        mandalaTemplatesFilePath: string | null;
    };
};
