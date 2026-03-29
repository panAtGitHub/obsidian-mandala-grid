import { describe, expect, it } from 'vitest';
import { resolveCellSurfaceVisual } from 'src/mandala-cell/visual/section-surface-visual';

describe('section-surface-visual', () => {
    it('resolves custom section backgrounds through the shared cell visual layer', () => {
        const visual = resolveCellSurfaceVisual({
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
        const visual = resolveCellSurfaceVisual({
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
});
