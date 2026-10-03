import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { settingsReducer } from 'src/mandala-settings/state/settings-reducer';
import { migrateSettings } from 'src/mandala-settings/state/migrations/migrate-settings';
import type { Settings } from 'src/mandala-settings/state/settings-type';

describe('saved interface language', () => {
    it('defaults to following Obsidian', () => {
        expect(DEFAULT_SETTINGS().general.interfaceLanguage).toBe('auto');
    });
    it.each(['en', 'zh', 'auto'] as const)(
        'saves and migrates %s without changing document defaults',
        (language) => {
            const settings = DEFAULT_SETTINGS();
            const template = settings.general.dayPlanDateHeadingCustomTemplate;
            const dateFormat = settings.general.dayPlanDateHeadingFormat;
            settingsReducer(settings, {
                type: 'settings/general/set-interface-language',
                payload: { language },
            });
            const restored = JSON.parse(JSON.stringify(settings)) as Settings;
            migrateSettings(restored);
            expect(restored.general.interfaceLanguage).toBe(language);
            expect(restored.general.dayPlanDateHeadingCustomTemplate).toBe(
                template,
            );
            expect(restored.general.dayPlanDateHeadingFormat).toBe(dateFormat);
        },
    );
    it('migrates a missing or invalid preference without resetting other settings', () => {
        const settings = DEFAULT_SETTINGS();
        const general = settings.general as unknown as Record<string, unknown>;
        delete general.interfaceLanguage;
        settings.view.fontSize = 23;
        migrateSettings(settings);
        expect(settings.general.interfaceLanguage).toBe('auto');
        general.interfaceLanguage = 'unsupported';
        migrateSettings(settings);
        expect(settings.general.interfaceLanguage).toBe('auto');
        expect(settings.view.fontSize).toBe(23);
    });
});
