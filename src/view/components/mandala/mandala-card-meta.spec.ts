import { describe, expect, it } from 'vitest';
import { buildMandalaCardMetaState } from './mandala-card-meta';

describe('buildMandalaCardMetaState', () => {
    it('keeps plain labels without pin or background in plain mode', () => {
        const state = buildMandalaCardMetaState({
            variant: 'plain',
            sectionColor: 'rgba(103, 127, 239, 0.65)',
            pinned: false,
            active: false,
            themeTone: 'light',
        });

        expect(state.showBackground).toBe(false);
        expect(state.showPin).toBe(false);
        expect(state.tone).toBeNull();
        expect(state.backgroundStyle).toBe('none');
    });

    it('shows pin without background for capsule mode when no section color exists', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: null,
            pinned: true,
            active: false,
            themeTone: 'dark',
        });

        expect(state.showBackground).toBe(false);
        expect(state.showPin).toBe(true);
        expect(state.tone).toBeNull();
        expect(state.backgroundStyle).toBe('none');
    });

    it('uses dark text for bright section capsules', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: 'rgba(233, 217, 103, 0.75)',
            pinned: false,
            active: false,
            themeTone: 'dark',
        });

        expect(state.showBackground).toBe(true);
        expect(state.showPin).toBe(false);
        expect(state.tone).toBe('dark');
        expect(state.backgroundStyle).toBe('section');
    });

    it('uses light text for dark section capsules', () => {
        const state = buildMandalaCardMetaState({
            variant: 'section-capsule',
            sectionColor: 'rgba(43, 48, 64, 0.9)',
            pinned: true,
            active: true,
            themeTone: 'light',
        });

        expect(state.showBackground).toBe(true);
        expect(state.showPin).toBe(true);
        expect(state.tone).toBe('light');
        expect(state.backgroundStyle).toBe('section');
    });

    it('does not leak pin into plain 9x9-style labels', () => {
        const state = buildMandalaCardMetaState({
            variant: 'plain',
            sectionColor: null,
            pinned: true,
            active: true,
            themeTone: 'light',
        });

        expect(state.showBackground).toBe(false);
        expect(state.showPin).toBe(false);
        expect(state.tone).toBeNull();
        expect(state.backgroundStyle).toBe('none');
    });

    it('keeps table-lite inactive states background-free', () => {
        const state = buildMandalaCardMetaState({
            variant: 'table-lite',
            sectionColor: 'rgba(103, 127, 239, 0.65)',
            pinned: true,
            active: false,
            themeTone: 'light',
        });

        expect(state.showBackground).toBe(false);
        expect(state.showPin).toBe(true);
        expect(state.tone).toBeNull();
        expect(state.backgroundStyle).toBe('none');
    });

    it('adds a neutral background for active table-lite states', () => {
        const state = buildMandalaCardMetaState({
            variant: 'table-lite',
            sectionColor: null,
            pinned: false,
            active: true,
            themeTone: 'dark',
        });

        expect(state.showBackground).toBe(true);
        expect(state.showPin).toBe(false);
        expect(state.tone).toBeNull();
        expect(state.backgroundStyle).toBe('neutral');
    });
});
