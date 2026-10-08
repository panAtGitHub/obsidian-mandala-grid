import { describe, expect, it } from 'vitest';
import { resolvePinnedItemColorStyle } from 'src/mandala-display/policies/pinned-item-color-style';
import { resolveOpaqueFillColor } from 'src/mandala-display/contrast/readable-text-tone';
import { resolveCellSectionColorVisual } from 'src/mandala-cell/visual/section-color-visual';

describe('section-color-visual', () => {
    it('keeps the default badge color opaque in colored card mode', () => {
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
        expect(visual.metaVariant).toBe('capsule');
        expect(visual.metaBackgroundColor).toBe('rgba(233, 217, 103, 1)');
    });

    it('keeps plain-with-pin color accents on the capsule path when a colored background exists', () => {
        const visual = resolveCellSectionColorVisual({
            section: '1.1',
            colorContext: {
                backgroundMode: 'custom',
                sectionColorsBySection: { '1.1': '#323232' },
                sectionColorOpacity: 100,
            },
            indicatorVariant: 'plain-with-pin',
            pinned: true,
            themeTone: 'light',
        });

        expect(visual.backgroundColor).toBe('rgba(50, 50, 50, 1)');
        expect(visual.metaVariant).toBe('capsule');
        expect(visual.metaAccentColor).toBe('rgba(50, 50, 50, 1)');
        expect(visual.metaTextTone).toBe('light');
        expect(visual.showPin).toBe(true);
    });
    it.each(['none', 'gray'])(
        'keeps assigned color on the number in %s mode',
        (backgroundMode) => {
            for (const indicatorVariant of [
                'section-capsule',
                'plain-with-pin',
            ] as const) {
                const visual = resolveCellSectionColorVisual({
                    section: '1.1',
                    colorContext: {
                        backgroundMode,
                        sectionColorsBySection: { '1.1': '#323232' },
                        sectionColorOpacity: 0,
                        showGrayBlockBackground: true,
                    },
                    indicatorVariant,
                    pinned: true,
                    themeTone: 'light',
                });
                expect(visual.metaVariant).toBe('capsule');
                expect(visual.metaBackgroundColor).toBe('rgba(50, 50, 50, 1)');
                expect(visual.metaTextTone).toBe('light');
                expect(visual.showPin).toBe(true);
                if (backgroundMode === 'none')
                    expect(visual.backgroundColor).toBeNull();
                else expect(visual.backgroundColor).toContain('color-mix');
            }
        },
    );

    it('returns to plain numbering after clearing an assigned color', () => {
        const visual = resolveCellSectionColorVisual({
            section: '1.1',
            colorContext: {
                backgroundMode: 'gray',
                sectionColorsBySection: {},
                sectionColorOpacity: 80,
                showGrayBlockBackground: true,
            },
            indicatorVariant: 'section-capsule',
            pinned: false,
            themeTone: 'light',
        });
        expect(visual.backgroundColor).toContain('color-mix');
        expect(visual.metaVariant).toBe('plain');
        expect(visual.metaBackgroundColor).toBeNull();
    });
    it.each(['none', 'gray', 'custom'])(
        'adjusts badge fill independently of cell background in %s mode',
        (backgroundMode) => {
            const visual = resolveCellSectionColorVisual({
                section: '1.1',
                colorContext: {
                    backgroundMode,
                    sectionColorsBySection: { '1.1': '#323232' },
                    sectionColorOpacity: 75,
                },
                colorIndicatorOpacity: 25,
                indicatorVariant: 'section-capsule',
                pinned: false,
                themeTone: 'light',
                themeUnderlayColor: '#ffffff',
            });
            expect(visual.metaBackgroundColor).toBe('rgba(204, 204, 204, 1)');
            expect(visual.metaTextTone).toBe('dark');
            expect(visual.backgroundColor).toBe(
                backgroundMode === 'custom' ? 'rgba(50, 50, 50, 0.75)' : null,
            );
        },
    );
    it.each(['#ffffff', '#232938'])(
        'matches the cell background and sidebar at 70 percent over %s',
        (underlay) => {
            const visual = resolveCellSectionColorVisual({
                section: '1.1',
                colorContext: {
                    backgroundMode: 'custom',
                    sectionColorsBySection: { '1.1': '#76BE77' },
                    sectionColorOpacity: 70,
                },
                colorIndicatorOpacity: 70,
                colorIndicatorUnderlayColor: underlay,
                indicatorVariant: 'plain-with-pin',
                pinned: false,
                themeTone: 'light',
            });
            expect(visual.metaBackgroundColor).toBe(
                resolveOpaqueFillColor(
                    visual.backgroundColor!,
                    'light',
                    underlay,
                ),
            );
            const sidebarStyle = resolvePinnedItemColorStyle({
                section: '1.1',
                sectionColorsBySection: { '1.1': '#76BE77' },
                colorIndicatorOpacity: 70,
                themeTone: 'light',
                themeUnderlayColor: underlay,
            });
            expect(sidebarStyle).toContain(
                `--pinned-item-bg: ${visual.metaBackgroundColor};`,
            );
        },
    );
});
