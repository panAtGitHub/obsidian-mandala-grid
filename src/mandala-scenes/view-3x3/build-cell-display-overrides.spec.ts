import { describe, expect, it } from 'vitest';
import { build3x3CellDisplayOverrides } from 'src/mandala-scenes/view-3x3/build-cell-display-overrides';

describe('build3x3CellDisplayOverrides', () => {
    it('returns only the 3x3-specific display differences', () => {
        expect(
            build3x3CellDisplayOverrides({
                whiteThemeMode: true,
            }),
        ).toEqual({
            sectionIndicatorVariant: 'plain-with-pin',
            preserveActiveBackground: true,
            contentLayout: 'fill',
        });
    });
});
