import { describe, expect, it } from 'vitest';
import { buildMandalaCardMetaState } from './mandala-card-meta';

describe('buildMandalaCardMetaState', () => {
    it('keeps plain labels without pin or background in plain mode', () => {
        const state = buildMandalaCardMetaState({
            variant: 'plain',
            sectionColor: 'rgba(103, 127, 239, 0.65)',
            pinned: false,
            themeTone: 'light',
        });

        expect(state.showBackground).toBe(false);
        expect(state.showPin).toBe(false);
        expect(state.textTone).toBeNull();
    });

    it('shows pin without background for capsule mode when no section color exists', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: null,
            pinned: true,
            themeTone: 'dark',
        });

        expect(state.showBackground).toBe(false);
        expect(state.showPin).toBe(true);
        expect(state.textTone).toBeNull();
    });

    it('uses dark text for bright section capsules', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: 'rgba(233, 217, 103, 0.75)',
            pinned: false,
            themeTone: 'dark',
        });

        expect(state.showBackground).toBe(true);
        expect(state.showPin).toBe(false);
        expect(state.textTone).toBe('dark');
    });

    it('uses light text for dark section capsules', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: 'rgba(43, 48, 64, 0.9)',
            pinned: true,
            themeTone: 'light',
        });

        expect(state.showBackground).toBe(true);
        expect(state.showPin).toBe(true);
        expect(state.textTone).toBe('light');
    });

    it('does not leak pin into plain 9x9-style labels', () => {
        const state = buildMandalaCardMetaState({
            variant: 'plain',
            sectionColor: null,
            pinned: true,
            themeTone: 'light',
        });

        expect(state.showBackground).toBe(false);
        expect(state.showPin).toBe(false);
        expect(state.textTone).toBeNull();
    });

    it('shows pin without background for plain-with-pin mode', () => {
        const state = buildMandalaCardMetaState({
            variant: 'plain-with-pin',
            sectionColor: null,
            pinned: true,
            themeTone: 'light',
        });

        expect(state.showBackground).toBe(false);
        expect(state.showPin).toBe(true);
        expect(state.textTone).toBeNull();
    });
});
