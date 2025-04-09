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

export type LineageDocumentFormat = 'outline' | 'sections' | 'html-element';

export type ViewType = 'lineage' | 'markdown';
export type DocumentPreferences = {
    documentFormat: LineageDocumentFormat;
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
        theme: Theme;
        cardWidth: number;
        cardsGap: number;
        minimumCardHeight?: number;
        scrolling: ScrollingSettings;
        limitPreviewHeight: boolean;
        zoomLevel: number;
        showMinimap: boolean;
        showLeftSidebar: boolean;
        leftSidebarWidth: number;
        leftSidebarActiveTab: LeftSidebarTab;
        applyGapBetweenCards: boolean;
        outlineMode: boolean;
        nodeIndentationWidth: number;
        maintainEditMode: boolean;
        alwaysShowCardButtons: boolean;
        hiddenVerticalToolbarButtons: ToolbarButton[];
    };
    general: {
        defaultDocumentFormat: LineageDocumentFormat;
        linkPaneType: LinkPaneType;
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
