import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';

describe('focusContainer', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'requestAnimationFrame',
            (callback: FrameRequestCallback) => {
                callback(0);
                return 0;
            },
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('does not focus the grid while the Store says editing is active', () => {
        const view = {
            isActive: true,
            container: {
                focus: vi.fn(),
            },
            viewStore: {
                getValue: () => ({
                    document: { editing: { activeNodeId: 'node-1' } },
                }),
            },
            inlineEditor: {
                nodeId: 'node-1',
                focus: vi.fn(),
            },
        };

        focusContainer(view as never);

        expect(view.inlineEditor.focus).not.toHaveBeenCalled();
        expect(view.container.focus).not.toHaveBeenCalled();
    });

    it('does not use a stale InlineEditor node as the editing state', () => {
        const view = {
            isActive: true,
            container: {
                focus: vi.fn(),
            },
            viewStore: {
                getValue: () => ({
                    document: { editing: { activeNodeId: null } },
                }),
            },
            inlineEditor: {
                nodeId: 'node-1',
                focus: vi.fn(),
            },
        };

        focusContainer(view as never);

        expect(view.inlineEditor.focus).not.toHaveBeenCalled();
        expect(view.container.focus).toHaveBeenCalledTimes(1);
    });

    it('focuses container when not editing', () => {
        const view = {
            isActive: true,
            container: {
                focus: vi.fn(),
            },
            viewStore: {
                getValue: () => ({
                    document: { editing: { activeNodeId: null } },
                }),
            },
            inlineEditor: {
                nodeId: null,
                focus: vi.fn(),
            },
        };

        focusContainer(view as never);

        expect(view.inlineEditor.focus).not.toHaveBeenCalled();
        expect(view.container.focus).toHaveBeenCalledTimes(1);
    });

    it('does not focus an inactive view container', () => {
        const view = {
            isActive: false,
            container: {
                focus: vi.fn(),
            },
            viewStore: {
                getValue: () => ({
                    document: { editing: { activeNodeId: null } },
                }),
            },
        };

        focusContainer(view as never);

        expect(view.container.focus).not.toHaveBeenCalled();
    });

    it('drops a queued grid focus when editing starts before the frame', () => {
        const frame: { current: FrameRequestCallback | null } = {
            current: null,
        };
        vi.stubGlobal(
            'requestAnimationFrame',
            (callback: FrameRequestCallback) => {
                frame.current = callback;
                return 0;
            },
        );
        let activeNodeId: string | null = null;
        const view = {
            isActive: true,
            container: {
                focus: vi.fn(),
            },
            viewStore: {
                getValue: () => ({
                    document: { editing: { activeNodeId } },
                }),
            },
        };

        focusContainer(view as never);
        activeNodeId = 'node-1';
        frame.current?.(0);

        expect(view.container.focus).not.toHaveBeenCalled();
    });
});
