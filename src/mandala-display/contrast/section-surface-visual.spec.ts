import { describe, expect, it } from 'vitest';
import { resolveSectionSurfaceVisual } from 'src/mandala-display/contrast/section-surface-visual';

describe('section-surface-visual', () => {
    it('resolves custom section backgrounds through the shared display visual layer', () => {
        const visual = resolveSectionSurfaceVisual({
            section: '1.2',
            colorContext: {
                backgroundMode: 'custom',
                sectionColorsBySection: {
                    '1.2': '#677FEF',
                },
                sectionColorOpacity: 65,
            },
            themeTone: 'light',
            themeUnderlayColor: '#ffffff',
        });

        expect(visual.backgroundColor).toBe('rgba(103, 127, 239, 0.65)');
        expect(visual.style).toContain(
            'background-color: rgba(103, 127, 239, 0.65);',
        );
    });

    it('resolves gray block surfaces through the same visual entry point', () => {
        const visual = resolveSectionSurfaceVisual({
            section: '1.2',
            colorContext: {
                backgroundMode: 'gray',
                sectionColorsBySection: {},
                sectionColorOpacity: 80,
                showGrayBlockBackground: true,
            },
        });

        expect(visual.backgroundColor).toBe(
            'color-mix(in srgb, var(--mandala-gray-block-base) 80%, transparent)',
        );
        expect(visual.style).toContain(
            'background-color: color-mix(in srgb, var(--mandala-gray-block-base) 80%, transparent);',
        );
    });

    it('supports custom css properties for non-card surfaces', () => {
        const visual = resolveSectionSurfaceVisual({
            section: '1.2',
            colorContext: {
                backgroundMode: 'custom',
                sectionColorsBySection: {
                    '1.2': '#677FEF',
                },
                sectionColorOpacity: 65,
            },
            backgroundCssProperty: '--pinned-item-bg',
        });

        expect(visual.style).toContain(
            '--pinned-item-bg: rgba(103, 127, 239, 0.65);',
        );
    });
});
