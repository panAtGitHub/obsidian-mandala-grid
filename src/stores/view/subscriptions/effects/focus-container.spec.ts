import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ isMobile: false }));

vi.mock('obsidian', () => ({
    Platform: platform,
}));

import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';

describe('focusContainer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        platform.isMobile = false;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('focuses inline editor on desktop when editing', () => {
        const view = {
            container: {
                focus: vi.fn(),
            },
            inlineEditor: {
                nodeId: 'node-1',
                focus: vi.fn(),
            },
        };

        focusContainer(view as never);
        vi.runOnlyPendingTimers();

        expect(view.inlineEditor.focus).toHaveBeenCalledTimes(1);
        expect(view.container.focus).not.toHaveBeenCalled();
    });

    it('does not force focus on mobile while editing', () => {
        platform.isMobile = true;
        const view = {
            container: {
                focus: vi.fn(),
            },
            inlineEditor: {
                nodeId: 'node-1',
                focus: vi.fn(),
            },
        };

        focusContainer(view as never);
        vi.runOnlyPendingTimers();

        expect(view.inlineEditor.focus).not.toHaveBeenCalled();
        expect(view.container.focus).not.toHaveBeenCalled();
    });

    it('focuses container when not editing', () => {
        const view = {
            container: {
                focus: vi.fn(),
            },
            inlineEditor: {
                nodeId: null,
                focus: vi.fn(),
            },
        };

        focusContainer(view as never);
        vi.runOnlyPendingTimers();

        expect(view.inlineEditor.focus).not.toHaveBeenCalled();
        expect(view.container.focus).toHaveBeenCalledTimes(1);
    });
});
