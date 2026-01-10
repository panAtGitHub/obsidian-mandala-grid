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
};
