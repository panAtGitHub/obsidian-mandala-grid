import { Settings } from 'src/stores/settings/settings-type';
import { Settings_0_5_4 } from 'src/stores/settings/migrations/old-settings-type';

export const migrateSettings = (settings: Settings | Settings_0_5_4) => {
    for (const [path, pref] of Object.entries(settings.documents)) {
        if (typeof pref === 'boolean') {
            settings.documents[path] = {
                documentFormat: 'sections',
                viewType: 'mandala-grid',
                activeSection: null,
                pinnedSections: null,
                outline: null,
            };
        }
    }

    if ('backup' in settings) {
        // @ts-ignore
        delete settings.backup;
    }

    const viewSettings = settings.view as {
        mandalaA4Mode?: boolean;
        mandalaA4Orientation?: 'portrait' | 'landscape';
        mandalaBackgroundMode?: 'none' | 'custom' | 'gray';
        mandalaGridBorderOpacity?: number;
        mandalaGridOrientation?:
            | 'south-start'
            | 'left-to-right'
            | 'bottom-to-top';
        mandalaShowSectionColors?: boolean;
        mandalaSectionColorOpacity?: number;
        mandalaGrayBackground?: boolean;
        show3x3SubgridNavButtons?: boolean;
        show9x9ParallelNavButtons?: boolean;
        show3x3SubgridNavButtonsDesktop?: boolean;
        show3x3SubgridNavButtonsMobile?: boolean;
        show9x9ParallelNavButtonsDesktop?: boolean;
        show9x9ParallelNavButtonsMobile?: boolean;
    };
    if (viewSettings.mandalaA4Mode === undefined) {
        viewSettings.mandalaA4Mode = false;
    }
    if (viewSettings.mandalaA4Orientation === undefined) {
        viewSettings.mandalaA4Orientation = 'landscape';
    }
    if (viewSettings.mandalaBackgroundMode === undefined) {
        if (viewSettings.mandalaShowSectionColors) {
            viewSettings.mandalaBackgroundMode = 'custom';
        } else if (viewSettings.mandalaGrayBackground) {
            viewSettings.mandalaBackgroundMode = 'gray';
        } else {
            viewSettings.mandalaBackgroundMode = 'none';
        }
    }
    if (viewSettings.mandalaGridBorderOpacity === undefined) {
        viewSettings.mandalaGridBorderOpacity = 100;
    }
    if (viewSettings.mandalaGridOrientation === undefined) {
        viewSettings.mandalaGridOrientation = 'left-to-right';
    }
    if (viewSettings.mandalaSectionColorOpacity === undefined) {
        viewSettings.mandalaSectionColorOpacity = 100;
    }

    // Legacy compatibility: split old shared toggle flags into desktop/mobile.
    if (typeof viewSettings.show3x3SubgridNavButtons === 'boolean') {
        viewSettings.show3x3SubgridNavButtonsDesktop =
            viewSettings.show3x3SubgridNavButtons;
        viewSettings.show3x3SubgridNavButtonsMobile =
            viewSettings.show3x3SubgridNavButtons;
    }
    if (typeof viewSettings.show9x9ParallelNavButtons === 'boolean') {
        viewSettings.show9x9ParallelNavButtonsDesktop =
            viewSettings.show9x9ParallelNavButtons;
        viewSettings.show9x9ParallelNavButtonsMobile =
            viewSettings.show9x9ParallelNavButtons;
    }
};
