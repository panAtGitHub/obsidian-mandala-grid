import { describe, expect, it } from 'vitest';
import { resolvePinnedItemColorStyle } from 'src/mandala-display/policies/pinned-item-color-style';

describe('resolvePinnedItemColorStyle', () => {
    it('builds pinned item background and text variables from the shared display color pipeline', () => {
        const style = resolvePinnedItemColorStyle({
            section: '1.2',
            backgroundMode: 'custom',
            sectionColorsBySection: {
                '1.2': '#677FEF',
            },
            sectionColorOpacity: 65,
            themeTone: 'light',
            themeUnderlayColor: '#ffffff',
        });

        expect(style).toContain('--pinned-item-bg: rgba(103, 127, 239, 0.65);');
        expect(style).toContain('--text-normal: #0f131a;');
    });
    it.each(['none', 'gray'])(
        'shows sidebar colors independently of %s grid backgrounds',
        (backgroundMode) => {
            const style = resolvePinnedItemColorStyle({
                section: '1.2',
                backgroundMode,
                sectionColorsBySection: { '1.2': '#323232' },
                sectionColorOpacity: 0,
                themeTone: 'light',
                themeUnderlayColor: '#ffffff',
            });
            expect(style).toContain('--pinned-item-bg: rgba(50, 50, 50, 1);');
            expect(style).toContain('--text-normal: #f3f6fd;');
        },
    );

    it.each(['none', 'gray', 'custom'])(
        'clears sidebar fill when color is removed in %s mode',
        (backgroundMode) => {
            expect(
                resolvePinnedItemColorStyle({
                    section: '1.2',
                    backgroundMode,
                    sectionColorsBySection: {},
                    sectionColorOpacity: 100,
                    themeTone: 'light',
                    themeUnderlayColor: '#ffffff',
                }),
            ).toBeUndefined();
        },
    );
});
