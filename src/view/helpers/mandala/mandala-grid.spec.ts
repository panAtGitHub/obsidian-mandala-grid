import { describe, expect, test } from 'vitest';
import {
    getMandalaLayoutById,
    posOfSection3x3,
    posOfSection9x9,
    sectionAtCell9x9,
} from 'src/view/helpers/mandala/mandala-grid';

describe('mandala-grid', () => {
    test('keeps builtin layouts stable', () => {
        const layout = getMandalaLayoutById('builtin:left-to-right', []);
        const southLayout = getMandalaLayoutById('builtin:south-start', []);

        expect(layout.previewPattern).toBe('123405678');
        expect(southLayout.previewPattern).toBe('637204518');
    });

    test('resolves custom layout by id', () => {
        const layout = getMandalaLayoutById('custom:1', [
            {
                id: 'custom:1',
                name: '顺时针',
                pattern: '876405123',
            },
        ]);

        expect(layout.previewPattern).toBe('876405123');
        expect(posOfSection3x3('1.8', 'custom:1', [
            { id: 'custom:1', name: '顺时针', pattern: '876405123' },
        ])).toEqual({ row: 0, col: 0 });
    });

    test('falls back when custom layout id is missing', () => {
        const layout = getMandalaLayoutById('custom:missing', []);

        expect(layout.previewPattern).toBe('123405678');
    });

    test('maps 9x9 sections using selected layout id', () => {
        const customLayouts = [
            {
                id: 'custom:1',
                name: '顺时针',
                pattern: '876405123',
            },
        ];

        expect(posOfSection9x9('1.8.1', 'custom:1', '1', customLayouts)).toEqual(
            { row: 2, col: 0 },
        );
        expect(sectionAtCell9x9(2, 0, 'custom:1', '1', customLayouts)).toBe(
            '1.8.1',
        );
    });
});
