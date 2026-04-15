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
            suppressRefocus: false,
        });
        expect(get(service.projectionStore)).toBe(null);
    });

    it('commits immediately when save is requested explicitly', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', true, 'hello');
        service.updateBuffer('hello world');
        service.requestSave();

        expect(onCommit).toHaveBeenCalledWith({
            nodeId: 'node-1',
            content: 'hello world',
            isInSidebar: true,
            reason: 'save',
            suppressRefocus: false,
        });
    });

    it('commits immediately on blur and keeps session active', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', false, 'hello');
        service.updateBuffer('hello world');
        service.requestBlurCommit();

        expect(onCommit).toHaveBeenCalledWith({
            nodeId: 'node-1',
            content: 'hello world',
            isInSidebar: false,
            reason: 'blur',
            suppressRefocus: true,
        });
        expect(get(service.stateStore).activeNodeId).toBe('node-1');
    });

    it('commits old node and starts new session on switchNode', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', false, 'hello');
        service.updateBuffer('hello world');
        service.switchNode('node-2', true, 'next');

        expect(onCommit).toHaveBeenCalledWith({
            nodeId: 'node-1',
            content: 'hello world',
            isInSidebar: false,
            reason: 'switch-node',
            suppressRefocus: false,
        });
        expect(get(service.stateStore).activeNodeId).toBe('node-2');
        expect(get(service.stateStore).isInSidebar).toBe(true);
        expect(get(service.stateStore).bufferContent).toBe('next');
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

    it('does not dispatch commit when endSession called on clean state', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', false, 'hello');
        service.endSession('disable-edit');

        expect(onCommit).not.toHaveBeenCalled();
    });

    it('does not dispatch when commit is called repeatedly after clean commit', () => {
        const onCommit = vi.fn();
        const service = new EditSessionService(onCommit);

        service.startSession('node-1', false, 'hello');
        service.updateBuffer('hello world');
        service.commit('save');
        service.commit('save');

        expect(onCommit).toHaveBeenCalledTimes(1);
    });
});
