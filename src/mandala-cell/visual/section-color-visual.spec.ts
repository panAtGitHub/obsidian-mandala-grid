import { describe, expect, it } from 'vitest';
import { resolveCellSectionColorVisual } from 'src/mandala-cell/visual/section-color-visual';

describe('section-color-visual', () => {
    it('uses the resolved surface color for both card and meta background in section-capsule mode', () => {
        const visual = resolveCellSectionColorVisual({
            section: '1.1',
            colorContext: {
                backgroundMode: 'custom',
                sectionColorsBySection: { '1.1': '#E9D967' },
                sectionColorOpacity: 100,
            },
            indicatorVariant: 'section-capsule',
            pinned: false,
            themeTone: 'light',
        });

        expect(visual.backgroundColor).toBe('rgba(233, 217, 103, 1)');
        expect(visual.metaVariant).toBe('background');
        expect(visual.metaBackgroundColor).toBe('rgba(233, 217, 103, 1)');
    });

    it('keeps plain-with-pin color accents on the capsule path when a colored background exists', () => {
        const visual = resolveCellSectionColorVisual({
            section: '1.1',
            colorContext: {
                backgroundMode: 'custom',
                sectionColorsBySection: { '1.1': '#E9D967' },
                sectionColorOpacity: 65,
            },
            indicatorVariant: 'plain-with-pin',
            pinned: true,
            themeTone: 'light',
        });

        expect(visual.backgroundColor).toBe('rgba(233, 217, 103, 0.65)');
        expect(visual.metaVariant).toBe('capsule');
        expect(visual.metaAccentColor).toBe('#E9D967');
        expect(visual.showPin).toBe(true);
    });
});
