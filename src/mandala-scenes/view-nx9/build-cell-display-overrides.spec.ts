import { describe, expect, it } from 'vitest';
import { buildNx9CellDisplayOverrides } from 'src/mandala-scenes/view-nx9/build-cell-display-overrides';

describe('buildNx9CellDisplayOverrides', () => {
    it('returns only the nx9-specific display differences in white theme', () => {
        expect(
            buildNx9CellDisplayOverrides({
                whiteThemeMode: true,
            }),
        ).toEqual({
            sectionIndicatorVariant: 'plain-with-pin',
            preserveActiveBackground: true,
            contentLayout: 'fill',
            hoverBehavior: 'none',
            inactiveSurfaceMode: 'detached',
        });
    });

    it('keeps only fill layout when white theme is off', () => {
        expect(
            buildNx9CellDisplayOverrides({
                whiteThemeMode: false,
            }),
        ).toEqual({
            contentLayout: 'fill',
            hoverBehavior: 'none',
            inactiveSurfaceMode: 'detached',
        });
    });
});
