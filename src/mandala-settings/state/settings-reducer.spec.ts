import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { settingsReducer } from 'src/mandala-settings/state/settings-reducer';

describe('settingsReducer custom grid layouts', () => {
    test('creates and selects a custom layout', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/view/mandala/create-custom-grid-layout',
            payload: {
                layout: {
                    id: 'custom:1',
                    name: ' 顺时针 ',
                    pattern: '123405678',
                },
            },
        });
        settingsReducer(settings, {
            type: 'settings/view/mandala/select-grid-layout',
            payload: { layoutId: 'custom:1' },
        });

        expect(settings.view.mandalaGridCustomLayouts).toHaveLength(1);
        expect(settings.view.mandalaGridCustomLayouts[0]?.name).toBe('顺时针');
        expect(settings.view.mandalaGridSelectedLayoutId).toBe('custom:1');
        expect(settings.view.mandalaGridOrientation).toBe('custom');
    });

    test('deleting selected custom layout falls back to builtin left-to-right', () => {
        const settings = DEFAULT_SETTINGS();
        settings.view.mandalaGridCustomLayouts = [
            { id: 'custom:1', name: '顺时针', pattern: '123405678' },
        ];
        settings.view.mandalaGridSelectedLayoutId = 'custom:1';
        settings.view.mandalaGridOrientation = 'custom';

        settingsReducer(settings, {
            type: 'settings/view/mandala/delete-custom-grid-layout',
            payload: { id: 'custom:1' },
        });

        expect(settings.view.mandalaGridCustomLayouts).toEqual([]);
        expect(settings.view.mandalaGridSelectedLayoutId).toBe(
            'builtin:left-to-right',
        );
        expect(settings.view.mandalaGridOrientation).toBe('left-to-right');
    });

    test('persists per-document mandala layout without affecting other files', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/documents/persist-mandala-view-state',
            payload: {
                path: 'a.md',
                gridOrientation: 'south-start',
                selectedLayoutId: 'builtin:south-start',
                lastActiveSection: '2',
                subgridTheme: '2',
                nx9RowsPerPage: 4,
            },
        });
        settingsReducer(settings, {
            type: 'settings/documents/persist-mandala-view-state',
            payload: {
                path: 'b.md',
                gridOrientation: 'left-to-right',
                selectedLayoutId: 'builtin:left-to-right',
                lastActiveSection: '3',
                subgridTheme: '3',
                nx9RowsPerPage: 5,
            },
        });

        expect(settings.documents['a.md']?.mandalaView).toMatchObject({
            selectedLayoutId: 'builtin:south-start',
            selectedCustomLayout: null,
            gridOrientation: 'south-start',
            lastActiveSection: '2',
            subgridTheme: '2',
            nx9RowsPerPage: 4,
        });
        expect(settings.documents['b.md']?.mandalaView).toMatchObject({
            selectedLayoutId: 'builtin:left-to-right',
            selectedCustomLayout: null,
            gridOrientation: 'left-to-right',
            lastActiveSection: '3',
            subgridTheme: '3',
            nx9RowsPerPage: 5,
        });
    });

    test('persists selected custom layout snapshot per document', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/documents/persist-mandala-view-state',
            payload: {
                path: 'a.md',
                gridOrientation: 'custom',
                selectedLayoutId: 'custom:a',
                selectedCustomLayout: {
                    id: 'custom:a',
                    name: 'A',
                    pattern: '123405678',
                },
                lastActiveSection: '2',
                subgridTheme: '2',
                nx9RowsPerPage: 6,
            },
        });

        expect(settings.documents['a.md']?.mandalaView).toMatchObject({
            selectedLayoutId: 'custom:a',
            selectedCustomLayout: {
                id: 'custom:a',
                name: 'A',
                pattern: '123405678',
            },
            nx9RowsPerPage: 6,
        });
    });

    test('toggles day plan today buttons independently per platform', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/view/toggle-day-plan-today-button-desktop',
        });
        settingsReducer(settings, {
            type: 'settings/view/toggle-day-plan-today-button-mobile',
        });

        expect(settings.view.showDayPlanTodayButtonDesktop).toBe(false);
        expect(settings.view.showDayPlanTodayButtonMobile).toBe(false);
    });

    test('updates day plan heading settings independently', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/general/set-day-plan-date-heading-format',
            payload: {
                format: 'custom',
            },
        });
        settingsReducer(settings, {
            type: 'settings/general/set-day-plan-date-heading-custom-template',
            payload: {
                template: '## {date} {zh}',
            },
        });
        settingsReducer(settings, {
            type: 'settings/general/set-day-plan-date-heading-apply-mode',
            payload: {
                mode: 'immediate',
            },
        });

        expect(settings.general.dayPlanDateHeadingFormat).toBe('custom');
        expect(settings.general.dayPlanDateHeadingCustomTemplate).toBe(
            '## {date} {zh}',
        );
        expect(settings.general.dayPlanDateHeadingApplyMode).toBe('immediate');
    });

    test('cycles mandala modes through 3x3, 9x9 and nx9', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/view/mandala/toggle-mode',
        });
        expect(settings.view.mandalaMode).toBe('9x9');

        settingsReducer(settings, {
            type: 'settings/view/mandala/toggle-mode',
        });
        expect(settings.view.mandalaMode).toBe('nx9');

        settingsReducer(settings, {
            type: 'settings/view/mandala/toggle-mode',
        });
        expect(settings.view.mandalaMode).toBe('3x3');
    });

    test('cycles mandala modes independently of week plan setting', () => {
        const settings = DEFAULT_SETTINGS();
        settings.general.weekPlanEnabled = false;

        settingsReducer(settings, {
            type: 'settings/view/mandala/toggle-mode',
        });
        expect(settings.view.mandalaMode).toBe('9x9');

        settingsReducer(settings, {
            type: 'settings/view/mandala/toggle-mode',
        });
        expect(settings.view.mandalaMode).toBe('nx9');

        settingsReducer(settings, {
            type: 'settings/view/mandala/toggle-mode',
        });
        expect(settings.view.mandalaMode).toBe('3x3');
    });

    test('updates week start setting', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/general/set-week-start',
            payload: { weekStart: 'sunday' },
        });

        expect(settings.general.weekStart).toBe('sunday');
    });

    test('updates week compact mode setting', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/general/set-week-plan-compact-mode',
            payload: { enabled: false },
        });

        expect(settings.general.weekPlanCompactMode).toBe(false);
    });

    test('disabling week plan keeps mandala mode unchanged', () => {
        const settings = DEFAULT_SETTINGS();
        settings.view.mandalaMode = 'nx9';

        settingsReducer(settings, {
            type: 'settings/general/set-week-plan-enabled',
            payload: { enabled: false },
        });

        expect(settings.general.weekPlanEnabled).toBe(false);
        expect(settings.view.mandalaMode).toBe('nx9');
    });
});
