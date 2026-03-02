import { describe, expect, it } from 'vitest';
import { buildMandalaCardStyle } from './mandala-card-style';

describe('buildMandalaCardStyle', () => {
    it('keeps section background color when the card is active', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: 'rgba(103, 127, 239, 0.65)',
            style: undefined,
            themeTone: 'light',
        });

        expect(state.backgroundColor).toBe('rgba(103, 127, 239, 0.65)');
        expect(state.cardStyle).toContain(
            'background-color: rgba(103, 127, 239, 0.65)',
        );
    });

    it('keeps custom card background color when the card is active', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: null,
            style: {
                color: '#2B3040',
                styleVariant: 'background-color',
            },
            themeTone: 'dark',
        });

        expect(state.backgroundColor).toBe('#2B3040');
        expect(state.cardStyle).toContain('background-color: #2B3040');
        expect(state.shouldHideBackgroundStyle).toBe(true);
    });

    it('does not inject an active background when no custom background exists', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: null,
            style: undefined,
            themeTone: 'light',
        });

        expect(state.backgroundColor).toBeNull();
        expect(state.cardStyle).toBeUndefined();
    });

    it('keeps text contrast tokens for dark custom backgrounds', () => {
        const state = buildMandalaCardStyle({
            active: true,
            sectionColor: null,
            style: {
                color: '#2B3040',
                styleVariant: 'background-color',
            },
            themeTone: 'dark',
        });

        expect(state.textTone).toBe('light');
        expect(state.cardStyle).toContain('--text-normal: #f3f6fd');
    });
});
