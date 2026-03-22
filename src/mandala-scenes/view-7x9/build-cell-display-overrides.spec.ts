import { describe, expect, it } from 'vitest';
import { build7x9CellDisplayOverrides } from 'src/mandala-scenes/view-7x9/build-cell-display-overrides';

describe('build7x9CellDisplayOverrides', () => {
    it('returns white-theme and fill overrides for standard week cells', () => {
        expect(
            build7x9CellDisplayOverrides({
                whiteThemeMode: true,
                hasGridSelection: true,
                compactMode: false,
            }),
        ).toEqual({
            sectionIndicatorVariant: 'plain-with-pin',
            preserveActiveBackground: true,
            contentLayout: 'fill',
        });
    });

    it('keeps active background when the week grid has no selection', () => {
        expect(
            build7x9CellDisplayOverrides({
                whiteThemeMode: false,
                hasGridSelection: false,
                compactMode: false,
            }),
        ).toEqual({
            preserveActiveBackground: true,
            contentLayout: 'fill',
        });
    });

    it('adds compact-only density and scrollbar overrides when compact mode is on', () => {
        expect(
            build7x9CellDisplayOverrides({
                whiteThemeMode: false,
                hasGridSelection: true,
                compactMode: true,
            }),
        ).toEqual({
            contentLayout: 'fill',
            density: 'compact',
            scrollbarMode: 'hidden',
        });
    });
});
