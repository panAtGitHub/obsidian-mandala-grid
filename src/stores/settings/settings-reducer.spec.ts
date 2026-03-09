import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';
import { settingsReducer } from 'src/stores/settings/settings-reducer';

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
                showDetailSidebarDesktop: true,
                showDetailSidebarMobile: null,
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
                showDetailSidebarDesktop: false,
                showDetailSidebarMobile: null,
            },
        });

        expect(settings.documents['a.md']?.mandalaView).toMatchObject({
            selectedLayoutId: 'builtin:south-start',
            selectedCustomLayout: null,
            gridOrientation: 'south-start',
            lastActiveSection: '2',
            subgridTheme: '2',
            showDetailSidebarDesktop: true,
            showDetailSidebarMobile: null,
        });
        expect(settings.documents['b.md']?.mandalaView).toMatchObject({
            selectedLayoutId: 'builtin:left-to-right',
            selectedCustomLayout: null,
            gridOrientation: 'left-to-right',
            lastActiveSection: '3',
            subgridTheme: '3',
            showDetailSidebarDesktop: false,
            showDetailSidebarMobile: null,
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
                showDetailSidebarDesktop: true,
                showDetailSidebarMobile: null,
            },
        });

        expect(settings.documents['a.md']?.mandalaView).toMatchObject({
            selectedLayoutId: 'custom:a',
            selectedCustomLayout: {
                id: 'custom:a',
                name: 'A',
                pattern: '123405678',
            },
        });
    });
});
