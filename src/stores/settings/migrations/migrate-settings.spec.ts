import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';
import { migrateSettings } from 'src/stores/settings/migrations/migrate-settings';
import { Settings } from 'src/stores/settings/settings-type';

type SettingsWithLegacySidebar = Settings & {
    view: Settings['view'] & {
        showMandalaDetailSidebar?: boolean;
    };
};

describe('migrateSettings', () => {
    test('migrates legacy showMandalaDetailSidebar into desktop/mobile fields', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar;
        settings.view.showMandalaDetailSidebar = true;

        migrateSettings(settings);

        expect(settings.view.showMandalaDetailSidebarDesktop).toBe(true);
        expect(settings.view.showMandalaDetailSidebarMobile).toBe(true);
        expect('showMandalaDetailSidebar' in settings.view).toBe(false);
    });

    test('keeps split fields when legacy field is absent', () => {
        const settings = DEFAULT_SETTINGS();
        settings.view.showMandalaDetailSidebarDesktop = true;
        settings.view.showMandalaDetailSidebarMobile = false;

        migrateSettings(settings);

        expect(settings.view.showMandalaDetailSidebarDesktop).toBe(true);
        expect(settings.view.showMandalaDetailSidebarMobile).toBe(false);
    });
});
