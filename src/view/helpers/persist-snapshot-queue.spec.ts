import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PersistSnapshotQueue } from 'src/view/helpers/persist-snapshot-queue';

describe('PersistSnapshotQueue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps per-file snapshots independent', async () => {
        const persisted: Array<{ path: string; data: string }> = [];
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persist: async (path, data) => {
                persisted.push({ path, data });
            },
        });

        queue.queue('a.md', 'alpha');
        queue.queue('b.md', 'beta');

        await vi.advanceTimersByTimeAsync(2000);

        expect(persisted).toEqual([
            { path: 'a.md', data: 'alpha' },
            { path: 'b.md', data: 'beta' },
        ]);
    });

    it('flushes only the latest snapshot for the same file', async () => {
        const persisted: Array<{ path: string; data: string }> = [];
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persist: async (path, data) => {
                persisted.push({ path, data });
            },
        });

        queue.queue('a.md', 'alpha-1');
        queue.queue('a.md', 'alpha-2');

        await vi.advanceTimersByTimeAsync(2000);

        expect(persisted).toEqual([{ path: 'a.md', data: 'alpha-2' }]);
    });

    it('keeps failed snapshots queued for retry without blocking other files', async () => {
        let failA = true;
        const persisted: Array<{ path: string; data: string }> = [];
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persist: async (path, data) => {
                if (path === 'a.md' && failA) {
                    throw new Error('disk busy');
                }
                persisted.push({ path, data });
            },
        });

        queue.queue('a.md', 'alpha');
        queue.queue('b.md', 'beta');

        await vi.advanceTimersByTimeAsync(2000);
        await expect(queue.flushAll()).rejects.toThrow('disk busy');

        expect(persisted).toEqual([{ path: 'b.md', data: 'beta' }]);

        failA = false;
        await queue.flush('a.md');

        expect(persisted).toEqual([
            { path: 'b.md', data: 'beta' },
            { path: 'a.md', data: 'alpha' },
        ]);
    });
});
