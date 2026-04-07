import { describe, expect, it } from 'vitest';
import { resolveCanonicalActiveCell9x9 } from 'src/mandala-interaction/helpers/resolve-canonical-active-cell-9x9';

describe('resolveCanonicalActiveCell9x9', () => {
    it('returns the canonical 9x9 position for duplicated theme sections', () => {
        expect(
            resolveCanonicalActiveCell9x9({
                section: '1.2',
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                fallbackCell: { row: 4, col: 1 },
            }),
        ).toEqual({ row: 1, col: 4 });
    });

    it('falls back to the incoming cell when the section is empty', () => {
        expect(
            resolveCanonicalActiveCell9x9({
                section: null,
                selectedLayoutId: 'builtin:left-to-right',
                customLayouts: [],
                fallbackCell: { row: 4, col: 1 },
            }),
        ).toEqual({ row: 4, col: 1 });
    });
});
