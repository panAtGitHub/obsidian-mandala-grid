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
            persist: (path, data) => {
                persisted.push({ path, data });
                return Promise.resolve();
            },
        });

        queue.queue('a.md', 'alpha', '');
        queue.queue('b.md', 'beta', '');

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
            persist: (path, data) => {
                persisted.push({ path, data });
                return Promise.resolve();
            },
        });

        queue.queue('a.md', 'alpha-1', 'original');
        queue.queue('a.md', 'alpha-2', 'alpha-1');

        await vi.advanceTimersByTimeAsync(2000);

        expect(persisted).toEqual([{ path: 'a.md', data: 'alpha-2' }]);
    });

    it('advances the base when a new edit arrives during a write', async () => {
        let finish!: () => void;
        const writes: Array<[string, string]> = [];
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persist: async (_path, data, base) => {
                writes.push([data, base]);
                if (writes.length === 1) {
                    await new Promise<void>((resolve) => {
                        finish = resolve;
                    });
                }
            },
        });
        queue.queue('a.md', 'first', 'original');
        const flushing = queue.flush('a.md');
        await Promise.resolve();
        await Promise.resolve();
        queue.queue('a.md', 'second', 'first');
        finish();
        await flushing;
        expect(writes).toEqual([
            ['first', 'original'],
            ['second', 'first'],
        ]);
    });

    it('keeps failed snapshots queued for retry without blocking other files', async () => {
        let failA = true;
        const persisted: Array<{ path: string; data: string }> = [];
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persist: (path, data) => {
                if (path === 'a.md' && failA) {
                    throw new Error('disk busy');
                }
                persisted.push({ path, data });
                return Promise.resolve();
            },
        });

        queue.queue('a.md', 'alpha', '');
        queue.queue('b.md', 'beta', '');

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
