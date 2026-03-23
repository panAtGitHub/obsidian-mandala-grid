/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hideIdleScrollbar } from 'src/mandala-cell/view/actions/cell-scrollbar';

type SetupOptions = {
    enabled?: boolean;
};

const setupTarget = (options: SetupOptions = {}) => {
    const target = document.createElement('div');
    target.className = 'lng-prev';
    document.body.appendChild(target);

    return { target, enabled: options.enabled ?? true };
};

describe('hideIdleScrollbar', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('reveals on pointer enter and hides on pointer leave when delay is 0', () => {
        const { target, enabled } = setupTarget();
        const action = hideIdleScrollbar(target, {
            mode: 'interaction',
            enabled,
        });

        expect(target.classList.contains('mandala-idle-scrollbar')).toBe(true);
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        target.dispatchEvent(new Event('pointerenter'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);

        target.dispatchEvent(new Event('pointerleave'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        action.destroy();
    });

    it('keeps visible while interacting repeatedly', () => {
        const { target, enabled } = setupTarget();
        const action = hideIdleScrollbar(target, {
            mode: 'interaction',
            enabled,
        });

        target.dispatchEvent(new Event('wheel'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);

        target.dispatchEvent(new Event('pointermove'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);

        target.dispatchEvent(new Event('pointerleave'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);
        action.destroy();
    });

    it('reveals when container scrolls', () => {
        const { target, enabled } = setupTarget();
        const action = hideIdleScrollbar(target, {
            mode: 'interaction',
            enabled,
        });

        target.dispatchEvent(new Event('scroll'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);
        target.dispatchEvent(new Event('pointerleave'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        action.destroy();
    });

    it('does not activate when the scene disables it explicitly', () => {
        const { target, enabled } = setupTarget({ enabled: false });
        const action = hideIdleScrollbar(target, {
            mode: 'interaction',
            enabled,
        });

        target.dispatchEvent(new Event('pointerenter'));
        target.dispatchEvent(new Event('pointerleave'));

        expect(target.classList.contains('mandala-idle-scrollbar')).toBe(false);
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        action.destroy();
    });

    it('cleans up timer and listeners on destroy', () => {
        const { target, enabled } = setupTarget();
        const action = hideIdleScrollbar(target, {
            mode: 'interaction',
            enabled,
        });

        target.dispatchEvent(new Event('touchstart'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);

        action.destroy();
        expect(target.classList.contains('mandala-idle-scrollbar')).toBe(false);
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        target.dispatchEvent(new Event('pointerenter'));
        target.dispatchEvent(new Event('pointerleave'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);
    });
});
