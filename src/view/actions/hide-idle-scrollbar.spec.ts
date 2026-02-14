/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hideIdleScrollbar } from 'src/view/actions/hide-idle-scrollbar';

type SetupOptions = {
    withSidebar?: boolean;
    rootClass?: 'mandala-root--3' | 'mandala-root--9';
};

const setupTarget = (options: SetupOptions = {}) => {
    const root = document.createElement('div');
    root.className = `mandala-root ${options.rootClass ?? 'mandala-root--3'}`;

    const host = document.createElement('div');
    host.className = options.withSidebar
        ? 'mandala-detail-sidebar'
        : 'mandala-grid';

    const gridContainer = options.withSidebar
        ? document.createElement('div')
        : host;
    if (options.withSidebar) {
        gridContainer.className = 'mandala-grid';
        host.appendChild(gridContainer);
    }

    const target = document.createElement('div');
    target.className = 'lng-prev';
    gridContainer.appendChild(target);
    root.appendChild(host);
    document.body.appendChild(root);

    return { target };
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
        const { target } = setupTarget();
        const action = hideIdleScrollbar(target);

        expect(target.classList.contains('mandala-idle-scrollbar')).toBe(true);
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        target.dispatchEvent(new Event('pointerenter'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);

        target.dispatchEvent(new Event('pointerleave'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        action.destroy();
    });

    it('keeps visible while interacting repeatedly', () => {
        const { target } = setupTarget();
        const action = hideIdleScrollbar(target);

        target.dispatchEvent(new Event('wheel'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);

        target.dispatchEvent(new Event('pointermove'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);

        target.dispatchEvent(new Event('pointerleave'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);
        action.destroy();
    });

    it('reveals when container scrolls', () => {
        const { target } = setupTarget();
        const action = hideIdleScrollbar(target);

        target.dispatchEvent(new Event('scroll'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(true);
        target.dispatchEvent(new Event('pointerleave'));
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        action.destroy();
    });

    it('does not activate inside mandala detail sidebar', () => {
        const { target } = setupTarget({ withSidebar: true });
        const action = hideIdleScrollbar(target);

        target.dispatchEvent(new Event('pointerenter'));
        target.dispatchEvent(new Event('pointerleave'));

        expect(target.classList.contains('mandala-idle-scrollbar')).toBe(false);
        expect(target.classList.contains('is-scrollbar-visible')).toBe(false);

        action.destroy();
    });

    it('cleans up timer and listeners on destroy', () => {
        const { target } = setupTarget();
        const action = hideIdleScrollbar(target);

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
