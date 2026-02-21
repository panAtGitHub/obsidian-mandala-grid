import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';
import { migrateSettings } from 'src/stores/settings/migrations/migrate-settings';
import { Settings } from 'src/stores/settings/settings-type';

type SettingsWithLegacySidebar = Settings & {
    view: Settings['view'] & {
        showMandalaDetailSidebar?: boolean;
        show3x3SubgridNavButtons?: boolean;
        show9x9ParallelNavButtons?: boolean;
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

    test('does not overwrite split nav button fields when legacy nav fields exist', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar;
        settings.view.show3x3SubgridNavButtonsDesktop = false;
        settings.view.show3x3SubgridNavButtonsMobile = false;
        settings.view.show9x9ParallelNavButtonsDesktop = false;
        settings.view.show9x9ParallelNavButtonsMobile = false;
        settings.view.show3x3SubgridNavButtons = true;
        settings.view.show9x9ParallelNavButtons = true;

        migrateSettings(settings);

        expect(settings.view.show3x3SubgridNavButtonsDesktop).toBe(false);
        expect(settings.view.show3x3SubgridNavButtonsMobile).toBe(false);
        expect(settings.view.show9x9ParallelNavButtonsDesktop).toBe(false);
        expect(settings.view.show9x9ParallelNavButtonsMobile).toBe(false);
        expect('show3x3SubgridNavButtons' in settings.view).toBe(false);
        expect('show9x9ParallelNavButtons' in settings.view).toBe(false);
    });

    test('drops non-migrated empty mandalaView defaults to allow frontmatter fallback', () => {
        const settings = DEFAULT_SETTINGS();
        settings.documents['foo.md'] = {
            documentFormat: 'sections',
            viewType: 'mandala-grid',
            activeSection: null,
            outline: null,
            mandalaView: {
                gridOrientation: null,
                lastActiveSection: null,
                pinnedSections: [],
                sectionColors: {},
            },
        };

        migrateSettings(settings);

        expect(settings.documents['foo.md'].mandalaView).toBeUndefined();
    });

    test('keeps migrated empty mandalaView as explicit persisted state', () => {
        const settings = DEFAULT_SETTINGS();
        settings.documents['foo.md'] = {
            documentFormat: 'sections',
            viewType: 'mandala-grid',
            activeSection: null,
            outline: null,
            mandalaView: {
                migrated: true,
                pinnedSections: [],
                sectionColors: {},
            },
        };

        migrateSettings(settings);

        expect(settings.documents['foo.md'].mandalaView).toEqual({
            migrated: true,
            pinnedSections: [],
            sectionColors: {},
        });
    });
});
