import { describe, expect, it } from 'vitest';
import { resolvePinnedItemColorStyle } from 'src/mandala-display/policies/pinned-item-color-style';

describe('resolvePinnedItemColorStyle', () => {
    it('builds pinned item background and text variables from the shared display color pipeline', () => {
        const style = resolvePinnedItemColorStyle({
            section: '1.2',
            sectionColorsBySection: {
                '1.2': '#677FEF',
            },
            colorIndicatorOpacity: 65,
            themeTone: 'light',
            themeUnderlayColor: '#ffffff',
        });

        expect(style).toContain('--pinned-item-bg: rgba(156, 172, 245, 1);');
        expect(style).toContain('--text-normal: #0f131a;');
    });
    it.each(['none', 'gray'])(
        'shows sidebar colors independently of %s grid backgrounds',
        () => {
            const style = resolvePinnedItemColorStyle({
                section: '1.2',
                sectionColorsBySection: { '1.2': '#323232' },
                colorIndicatorOpacity: 25,
                themeTone: 'light',
                themeUnderlayColor: '#ffffff',
            });
            expect(style).toContain(
                '--pinned-item-bg: rgba(204, 204, 204, 1);',
            );
            expect(style).toContain('--text-normal: #0f131a;');
        },
    );

    it.each(['none', 'gray', 'custom'])(
        'clears sidebar fill when color is removed in %s mode',
        () => {
            expect(
                resolvePinnedItemColorStyle({
                    section: '1.2',
                    sectionColorsBySection: {},
                    colorIndicatorOpacity: 100,
                    themeTone: 'light',
                    themeUnderlayColor: '#ffffff',
                }),
            ).toBeUndefined();
        },
    );
});
