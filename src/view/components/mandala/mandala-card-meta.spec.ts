import { describe, expect, it } from 'vitest';
import { buildMandalaCardMetaState } from './mandala-card-meta';

describe('buildMandalaCardMetaState', () => {
    it('keeps plain labels outside the section capsule variant', () => {
        const state = buildMandalaCardMetaState({
            variant: 'plain',
            sectionColor: 'rgba(103, 127, 239, 0.65)',
            themeTone: 'light',
        });

        expect(state.showCapsule).toBe(false);
        expect(state.textTone).toBeNull();
    });

    it('keeps plain labels when no section color exists', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: null,
            themeTone: 'dark',
        });

        expect(state.showCapsule).toBe(false);
        expect(state.textTone).toBeNull();
    });

    it('uses dark text for bright section capsules', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: 'rgba(233, 217, 103, 0.75)',
            themeTone: 'dark',
        });

        expect(state.showCapsule).toBe(true);
        expect(state.textTone).toBe('dark');
    });

    it('uses light text for dark section capsules', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: 'rgba(43, 48, 64, 0.9)',
            themeTone: 'light',
        });

        expect(state.showCapsule).toBe(true);
        expect(state.textTone).toBe('light');
    });
});
