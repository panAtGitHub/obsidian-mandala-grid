import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';
import { settingsReducer } from 'src/stores/settings/settings-reducer';

describe('settingsReducer custom grid layouts', () => {
    test('adds and selects a custom layout', () => {
        const settings = DEFAULT_SETTINGS();

        settingsReducer(settings, {
            type: 'settings/view/mandala/add-custom-grid-layout',
            payload: {
                layout: {
                    id: 'custom:1',
                    name: '顺时针',
                    pattern: '123405678',
                },
            },
        });
        settingsReducer(settings, {
            type: 'settings/view/mandala/select-grid-layout',
            payload: { layoutId: 'custom:1' },
        });

        expect(settings.view.mandalaGridCustomLayouts).toHaveLength(1);
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
});
