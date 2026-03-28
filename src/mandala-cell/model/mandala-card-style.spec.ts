import { describe, expect, it } from 'vitest';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import { buildMandalaCardStyle } from './mandala-card-style';

describe('buildMandalaCardStyle', () => {
    it('keeps existing active background behavior by default', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: 'rgba(103, 127, 239, 0.65)',
            style: undefined,
            themeTone: 'light',
        });

        expect(state.backgroundColor).toBeNull();
        expect(state.cardStyle).toContain(
            'background-color: var(--background-active-node) !important',
        );
    });

    it('keeps section background color when table style asks to preserve it', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: 'rgba(103, 127, 239, 0.65)',
            preserveActiveBackground: true,
            style: undefined,
            themeTone: 'light',
        });

        expect(state.backgroundColor).toBe('rgba(103, 127, 239, 0.65)');
        expect(state.cardStyle).toContain(
            'background-color: rgba(103, 127, 239, 0.65)',
        );
    });

    it('keeps custom card background color only when preserve mode is enabled', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: null,
            preserveActiveBackground: true,
            style: {
                color: '#2B3040',
                styleVariant: 'background-color',
            },
            themeTone: 'dark',
        });

        expect(state.backgroundColor).toBe('#2B3040');
        expect(state.cardStyle).not.toContain('background-color: #2B3040');
        expect(state.shouldHideBackgroundStyle).toBe(false);
    });

    it('injects the active background when no custom background exists by default', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: null,
            style: undefined,
            themeTone: 'light',
        });

        expect(state.backgroundColor).toBeNull();
        expect(state.cardStyle).toContain(
            'background-color: var(--background-active-node) !important',
        );
    });

    it('keeps text contrast tokens for dark custom backgrounds', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: null,
            preserveActiveBackground: true,
            style: {
                color: '#2B3040',
                styleVariant: 'background-color',
            },
            themeTone: 'dark',
        });

        expect(state.textTone).toBe('light');
        expect(state.cardStyle).toContain('--text-normal: #f3f6fd');
    });

    it('provides detached inactive surface and body styles for plain nx9 cards', () => {
        const state = buildMandalaCardStyle({
            active: false,
            sectionColor: null,
            style: undefined,
            themeTone: 'light',
        });

        expect(state.surfaceStyle).toContain(
            'background-color: var(--background-primary)',
        );
        expect(state.bodyStyle).toContain('opacity: var(--inactive-card-opacity)');
        expect(state.bodyStyle).toContain(
            '--text-normal: var(--color-active-parent)',
        );
    });

    it('keeps contrast text tokens on detached inactive section-color cards', () => {
        const state = buildMandalaCardStyle({
            active: false,
            sectionColor: 'rgba(103, 127, 239, 0.65)',
            style: undefined,
            themeTone: 'light',
        });

        expect(state.surfaceStyle).toContain(
            'background-color: rgba(103, 127, 239, 0.65)',
        );
        expect(state.bodyStyle).toContain('opacity: var(--inactive-card-opacity)');
        expect(state.bodyStyle).toContain('--text-normal: #0f131a');
    });

    it('keeps plain inactive cards aligned across shared card-grid styles', () => {
        const styles = [
            resolveCardGridStyle({
                whiteThemeMode: false,
            }),
            resolveCardGridStyle({
                whiteThemeMode: false,
            }),
            resolveCardGridStyle({
                whiteThemeMode: false,
                compactMode: true,
            }),
        ];

        for (const gridStyle of styles) {
            const state = buildMandalaCardStyle({
                active: false,
                sectionColor: null,
                style: undefined,
                preserveActiveBackground:
                    gridStyle.cellDisplayPolicy.preserveActiveBackground,
                themeTone: 'light',
            });

            expect(state.surfaceStyle).toContain(
                'background-color: var(--background-primary)',
            );
        }
    });
});
