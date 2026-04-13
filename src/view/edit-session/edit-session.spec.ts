import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { EditSessionService } from 'src/view/edit-session/edit-session-service';

describe('edit-session-service', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('keeps typing local until the projection debounce elapses', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', true, 'hello');
        service.updateBuffer('hello world');

        expect(get(service.projectionStore)).toEqual({
            nodeId: 'node-1',
            content: 'hello',
            revision: 0,
        });
        vi.advanceTimersByTime(150);

        expect(get(service.projectionStore)).toEqual({
            nodeId: 'node-1',
            content: 'hello world',
            revision: 1,
        });
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('commits after the idle debounce', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', false, 'hello');
        service.updateBuffer('hello world');
        vi.advanceTimersByTime(600);

        expect(onCommit).toHaveBeenCalledWith({
            nodeId: 'node-1',
            content: 'hello world',
            isInSidebar: false,
            reason: 'idle',
        });
        expect(get(service.projectionStore)).toBe(null);
    });

    it('commits immediately when requested explicitly', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', true, 'hello');
        service.updateBuffer('hello world');
        service.commit('save');

        expect(onCommit).toHaveBeenCalledWith({
            nodeId: 'node-1',
            content: 'hello world',
            isInSidebar: true,
            reason: 'save',
        });
    });

    it('drops dirty changes on cancel', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', false, 'hello');
        service.updateBuffer('hello world');
        service.cancel();

        expect(get(service.stateStore).bufferContent).toBe('hello');
        expect(get(service.projectionStore)).toBe(null);
        expect(onCommit).not.toHaveBeenCalled();
    });

    it('ends the session and clears the active node', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', false, 'hello');
        service.updateBuffer('hello world');
        service.endSession('disable-edit');

        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(get(service.stateStore).activeNodeId).toBe(null);
        expect(get(service.projectionStore)).toBe(null);
    });
});
