import { describe, expect, test } from 'vitest';
import {
    BUILTIN_MANDALA_LAYOUT_PATTERNS,
    BUILTIN_MANDALA_LAYOUT_IDS,
    gridToPattern,
    normalizeMandalaCustomLayouts,
    patternToGrid,
    patternToPreviewRows,
    resolveMandalaLayoutId,
} from 'src/view/helpers/mandala/mandala-grid-custom-layout';

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
});
