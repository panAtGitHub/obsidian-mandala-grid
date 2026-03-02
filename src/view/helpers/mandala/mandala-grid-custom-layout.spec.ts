import { describe, expect, test } from 'vitest';
import {
    BUILTIN_MANDALA_LAYOUT_PATTERNS,
    BUILTIN_MANDALA_LAYOUT_IDS,
    gridToPattern,
    normalizeMandalaCustomLayouts,
    patternToGrid,
    patternToPreviewRows,
    resolveDocumentMandalaLayoutId,
    resolveMandalaLayoutId,
} from 'src/view/helpers/mandala/mandala-grid-custom-layout';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';

describe('mandala-grid-custom-layout', () => {
    test('converts pattern to grid and back', () => {
        const grid = patternToGrid('123405678');

        expect(grid).toEqual([
            ['1', '2', '3'],
            ['4', '0', '5'],
            ['6', '7', '8'],
        ]);
        expect(gridToPattern(grid)).toBe('123405678');
    });

    test('builds preview rows for builtin patterns', () => {
        expect(
            patternToPreviewRows(
                BUILTIN_MANDALA_LAYOUT_PATTERNS['left-to-right'],
            ),
        ).toEqual(['1 2 3', '4 0 5', '6 7 8']);
        expect(
            patternToPreviewRows(BUILTIN_MANDALA_LAYOUT_PATTERNS['south-start']),
        ).toEqual(['6 3 7', '2 0 4', '5 1 8']);
    });

    test('normalizes custom layouts and resolves fallback ids', () => {
        const customLayouts = normalizeMandalaCustomLayouts([
            { id: 'custom:1', name: '', pattern: 'bad' },
        ]);

        expect(customLayouts).toEqual([
            {
                id: 'custom:1',
                name: '未命名布局',
                pattern: '123405678',
            },
        ]);
        expect(resolveMandalaLayoutId('custom:missing', customLayouts)).toBe(
            BUILTIN_MANDALA_LAYOUT_IDS['left-to-right'],
        );
    });

    test('prefers document layout over global layout', () => {
        const settings = DEFAULT_SETTINGS();
        settings.view.mandalaGridSelectedLayoutId =
            BUILTIN_MANDALA_LAYOUT_IDS['south-start'];
        settings.documents['a.md'] = {
            viewType: 'mandala-grid',
            activeSection: null,
            outline: null,
            mandalaView: {
                gridOrientation: 'left-to-right',
                selectedLayoutId: BUILTIN_MANDALA_LAYOUT_IDS['left-to-right'],
                lastActiveSection: null,
                subgridTheme: null,
                pinnedSections: [],
                sectionColors: {},
            },
        };

        expect(
            resolveDocumentMandalaLayoutId({
                path: 'a.md',
                settings,
            }),
        ).toBe(BUILTIN_MANDALA_LAYOUT_IDS['left-to-right']);
    });

    test('falls back to global layout when document layout is missing', () => {
        const settings = DEFAULT_SETTINGS();
        settings.view.mandalaGridSelectedLayoutId =
            BUILTIN_MANDALA_LAYOUT_IDS['south-start'];

        expect(
            resolveDocumentMandalaLayoutId({
                path: 'a.md',
                settings,
            }),
        ).toBe(BUILTIN_MANDALA_LAYOUT_IDS['south-start']);
    });
});
