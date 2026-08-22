import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
    Platform: { isMobile: false },
}));

import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';

describe('focusContainer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('focuses the inline editor when an inline edit is active', () => {
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
        vi.runAllTimers();

        expect(view.inlineEditor.focus).toHaveBeenCalledTimes(1);
        expect(view.container.focus).not.toHaveBeenCalled();
    });

    it('focuses the container when no inline edit is active', () => {
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
        vi.runAllTimers();

        expect(view.inlineEditor.focus).not.toHaveBeenCalled();
        expect(view.container.focus).toHaveBeenCalledTimes(1);
    });
});
