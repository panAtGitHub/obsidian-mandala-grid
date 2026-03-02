import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';
import { migrateSettings } from 'src/stores/settings/migrations/migrate-settings';
import { Settings } from 'src/stores/settings/settings-type';

type SettingsWithLegacySidebar = Settings & {
    styleRules?: unknown;
    view: Settings['view'] & {
        maintainEditMode?: boolean;
        showMandalaDetailSidebar?: boolean;
        detailSidebarPreviewMode?: 'rendered' | 'source';
        show3x3SubgridNavButtons?: boolean;
        show9x9ParallelNavButtons?: boolean;
        showMinimap?: boolean;
        minimapWidth?: number;
        minimapPosition?: 'left' | 'right';
        outlineMode?: boolean;
        leftSidebarActiveTab?: string;
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

    test('drops legacy detailSidebarPreviewMode without overriding split fields', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar;
        settings.view.detailSidebarPreviewModeDesktop = 'rendered';
        settings.view.detailSidebarPreviewModeMobile = 'source';
        settings.view.detailSidebarPreviewMode = 'source';

        migrateSettings(settings);

        expect(settings.view.detailSidebarPreviewModeDesktop).toBe('rendered');
        expect(settings.view.detailSidebarPreviewModeMobile).toBe('source');
        expect('detailSidebarPreviewMode' in settings.view).toBe(false);
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

    test('drops legacy maintainEditMode field', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar;
        settings.view.maintainEditMode = true;

        migrateSettings(settings);

        expect('maintainEditMode' in settings.view).toBe(false);
    });

    test('adds default mandalaView when missing', () => {
        const settings = DEFAULT_SETTINGS();
        settings.documents['foo.md'] = {
            viewType: 'mandala-grid',
            activeSection: null,
            outline: null,
        } as unknown as Settings['documents'][string];

        migrateSettings(settings);

        expect(settings.documents['foo.md'].mandalaView).toEqual({
            gridOrientation: null,
            selectedLayoutId: null,
            lastActiveSection: null,
            subgridTheme: null,
            showDetailSidebarDesktop: null,
            showDetailSidebarMobile: null,
            pinnedSections: [],
            sectionColors: {},
        });
    });

    test('migrates legacy grid orientation into selected layout id', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar & {
            view: Settings['view'] & {
                mandalaGridSelectedLayoutId?: string;
            };
        };
        settings.view.mandalaGridOrientation = 'south-start';
        delete (settings.view as Record<string, unknown>).mandalaGridSelectedLayoutId;
        settings.documents['foo.md'] = {
            viewType: 'mandala-grid',
            activeSection: null,
            outline: null,
            mandalaView: {
                gridOrientation: 'left-to-right',
                selectedLayoutId: null,
                lastActiveSection: null,
                subgridTheme: null,
                showDetailSidebarDesktop: null,
                showDetailSidebarMobile: null,
                pinnedSections: [],
                sectionColors: {},
            },
        };

        migrateSettings(settings);

        expect(settings.view.mandalaGridSelectedLayoutId).toBe(
            'builtin:south-start',
        );
        expect(settings.documents['foo.md'].mandalaView.selectedLayoutId).toBe(
            'builtin:left-to-right',
        );
    });

    test('falls back removed bottom-to-top orientation to left-to-right', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar;
        (settings.view as Record<string, unknown>).mandalaGridOrientation =
            'bottom-to-top';
        settings.documents['foo.md'] = {
            viewType: 'mandala-grid',
            activeSection: null,
            outline: null,
            mandalaView: {
                gridOrientation: 'custom',
                selectedLayoutId: 'custom:missing',
                lastActiveSection: null,
                subgridTheme: null,
                showDetailSidebarDesktop: null,
                showDetailSidebarMobile: null,
                pinnedSections: [],
                sectionColors: {},
            },
        };

        migrateSettings(settings);

        expect(settings.view.mandalaGridSelectedLayoutId).toBe(
            'builtin:left-to-right',
        );
        expect(settings.documents['foo.md'].mandalaView.selectedLayoutId).toBe(
            'builtin:left-to-right',
        );
    });

    test('normalizes custom layout list and invalid selected ids', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar;
        (
            settings.view as Settings['view'] & {
                mandalaGridSelectedLayoutId?: string;
                mandalaGridCustomLayouts?: unknown;
            }
        ).mandalaGridSelectedLayoutId = 'custom:missing';
        (
            settings.view as Settings['view'] & {
                mandalaGridCustomLayouts?: unknown;
            }
        ).mandalaGridCustomLayouts = [
            {
                id: 'custom:1',
                name: '',
                pattern: 'invalid',
            },
        ];

        migrateSettings(settings);

        expect(settings.view.mandalaGridCustomLayouts).toEqual([
            {
                id: 'custom:1',
                name: '未命名布局',
                pattern: '123405678',
            },
        ]);
        expect(settings.view.mandalaGridSelectedLayoutId).toBe(
            'builtin:left-to-right',
        );
    });

    test('cleans legacy root/view keys and normalizes sidebar tab', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar;
        settings.styleRules = { rules: [] };
        settings.view.showMinimap = true;
        settings.view.minimapWidth = 240;
        settings.view.minimapPosition = 'right';
        settings.view.outlineMode = true;
        (settings.view as Record<string, unknown>).leftSidebarActiveTab =
            'recent-cards';

        migrateSettings(settings);

        expect('styleRules' in settings).toBe(false);
        expect('showMinimap' in settings.view).toBe(false);
        expect('minimapWidth' in settings.view).toBe(false);
        expect('minimapPosition' in settings.view).toBe(false);
        expect('outlineMode' in settings.view).toBe(false);
        expect(settings.view.leftSidebarActiveTab).toBe('pinned-cards');
    });

    test('drops removed undo/redo custom hotkeys', () => {
        const settings = DEFAULT_SETTINGS();
        (settings.hotkeys.customHotkeys as Record<string, unknown>).undo_change =
            { primary: { key: 'z', modifiers: ['Mod'] } };
        (settings.hotkeys.customHotkeys as Record<string, unknown>).redo_change =
            { primary: { key: 'y', modifiers: ['Mod'] } };

        migrateSettings(settings);

        expect('undo_change' in settings.hotkeys.customHotkeys).toBe(false);
        expect('redo_change' in settings.hotkeys.customHotkeys).toBe(false);
    });

    test('adds defaults for table highlight settings when missing', () => {
        const settings = DEFAULT_SETTINGS() as SettingsWithLegacySidebar & {
            view: Settings['view'] & {
                mandalaGridHighlightColor?: unknown;
                mandalaGridHighlightWidth?: number;
            };
        };
        delete settings.view.mandalaGridHighlightWidth;
        settings.view.mandalaGridHighlightColor = 123;

        migrateSettings(settings);

        expect(settings.view.mandalaGridHighlightWidth).toBe(2);
        expect('mandalaGridHighlightColor' in settings.view).toBe(false);
    });
});
