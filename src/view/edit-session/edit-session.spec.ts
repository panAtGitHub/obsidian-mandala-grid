import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { EditSessionService } from './edit-session-service';

describe('desktop edit session', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('projects typing locally without committing, even after a pause', () => {
        const commit = vi.fn();
        const session = new EditSessionService(commit);
        session.startSession('one', false, 'before');
        session.updateBuffer('draft');
        expect(get(session.projectionStore)?.content).toBe('before');
        vi.advanceTimersByTime(5000);
        expect(get(session.projectionStore)?.content).toBe('draft');
        expect(commit).not.toHaveBeenCalled();
        session.endSession();
        expect(get(session.projectionStore)).toBeNull();
        expect(commit).not.toHaveBeenCalled();
    });

    it('projects composed text and saves only on an explicit request', async () => {
        const commit = vi.fn(() => true);
        const session = new EditSessionService(commit);
        session.startSession('one', true, '');
        session.setComposing(true);
        session.updateBuffer('拼');
        vi.advanceTimersByTime(1000);
        expect(get(session.projectionStore)?.content).toBe('');
        await expect(session.requestSave()).resolves.toBe(false);
        session.updateBuffer('拼音');
        session.setComposing(false);
        await expect(session.requestSave()).resolves.toBe(true);
        expect(commit).toHaveBeenCalledOnce();
        expect(commit).toHaveBeenCalledWith({
            nodeId: 'one',
            previousContent: '',
            content: '拼音',
            isInSidebar: true,
        });
        expect(get(session.stateStore).dirty).toBe(false);
    });

    it('keeps a rejected draft and its original baseline for retry', async () => {
        const commit = vi.fn(() => false);
        const session = new EditSessionService(commit);
        session.startSession('one', false, 'before');
        session.updateBuffer('draft');
        await expect(session.requestSave()).resolves.toBe(false);
        expect(get(session.stateStore)).toMatchObject({
            activeNodeId: 'one',
            dirty: true,
            bufferContent: 'draft',
            lastCommittedContent: 'before',
        });
    });

    it('keeps newer typing and shares the in-flight save result', async () => {
        let finish!: (value: boolean) => void;
        const commit = vi.fn(
            () =>
                new Promise<boolean>((resolve) => {
                    finish = resolve;
                }),
        );
        const session = new EditSessionService(commit);
        session.startSession('one', false, 'before');
        session.updateBuffer('sent');
        const saving = session.requestSave();
        expect(session.requestSave()).toBe(saving);
        session.updateBuffer('newer draft');
        finish(true);
        await expect(saving).resolves.toBe(false);
        expect(get(session.stateStore)).toMatchObject({
            activeNodeId: 'one',
            dirty: true,
            lastCommittedContent: 'sent',
            bufferContent: 'newer draft',
        });
        expect(commit).toHaveBeenCalledTimes(1);
    });
});
