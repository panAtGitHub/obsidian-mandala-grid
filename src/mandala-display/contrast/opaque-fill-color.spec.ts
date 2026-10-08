import { describe, expect, it } from 'vitest';
import { resolveOpaqueFillColor } from 'src/mandala-display/contrast/readable-text-tone';

describe('resolveOpaqueFillColor', () => {
    it('flattens green at 70 percent against white instead of blending again with green', () => {
        expect(
            resolveOpaqueFillColor(
                'rgba(118, 190, 119, 0.7)',
                'light',
                '#ffffff',
            ),
        ).toBe('rgba(159, 210, 160, 1)');
    });
    it('preserves opaque colors and uses the base color at zero percent', () => {
        expect(
            resolveOpaqueFillColor(
                'rgba(118, 190, 119, 1)',
                'light',
                '#ffffff',
            ),
        ).toBe('rgba(118, 190, 119, 1)');
        expect(
            resolveOpaqueFillColor('rgba(118, 190, 119, 0)', 'dark', '#232938'),
        ).toBe('rgba(35, 41, 56, 1)');
    });
    it('uses the actual dark theme base and leaves final fills opaque', () => {
        expect(
            resolveOpaqueFillColor(
                'rgba(118, 190, 119, 0.7)',
                'dark',
                '#232938',
            ),
        ).toBe('rgba(93, 145, 100, 1)');
    });
});
