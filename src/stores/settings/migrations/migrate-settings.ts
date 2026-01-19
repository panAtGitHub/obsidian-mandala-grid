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
        mandalaA4Dpi?: number;
        mandalaBackgroundMode?: 'none' | 'custom' | 'gray';
        mandalaGridBorderOpacity?: number;
        mandalaShowSectionColors?: boolean;
        mandalaSectionColorOpacity?: number;
        mandalaGrayBackground?: boolean;
    };
    if (viewSettings.mandalaA4Mode === undefined) {
        viewSettings.mandalaA4Mode = false;
    }
    if (viewSettings.mandalaA4Orientation === undefined) {
        viewSettings.mandalaA4Orientation = 'portrait';
    }
    if (viewSettings.mandalaA4Dpi === undefined) {
        viewSettings.mandalaA4Dpi = 150;
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
    if (viewSettings.mandalaSectionColorOpacity === undefined) {
        viewSettings.mandalaSectionColorOpacity = 100;
    }
};
