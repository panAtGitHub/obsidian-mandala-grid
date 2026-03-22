import {
    CustomHotkeys,
    ScrollingSettings,
    Theme,
} from 'src/mandala-settings/state/settings-type';

export type DocumentBackup = {
    content: string;
    created: number;
};

export type Settings_0_5_4 = {
    documents: Record<string, true>;
    hotkeys: {
        customHotkeys: CustomHotkeys;
    };
    view: {
        fontSize: number;
        theme: Theme;
        cardWidth: number;
        minimumCardHeight?: number;
        scrolling: ScrollingSettings;
        limitPreviewHeight: boolean;
        zoomLevel: number;
    };
    // when view.inlineEditor is enabled, and the file is opened by another markdown view, inlineEditor overrides file.data with card.data
    // a copy of file.data is saved in case obsidian closes while file.data is set tod card.data
    backup: {
        [file_path: string]: DocumentBackup;
    };
};
