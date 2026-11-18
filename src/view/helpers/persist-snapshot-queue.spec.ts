import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PersistSnapshotQueue } from 'src/view/helpers/persist-snapshot-queue';
import type { SectionContentEdit } from 'src/mandala-document/runtime/patch-section-contents';

const edit = (before: string, after: string, sectionId = '1') => ({
    sectionId,
    before,
    after,
});

describe('PersistSnapshotQueue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('keeps per-file edits independent', async () => {
        const persistSections = vi.fn(async () => {});
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: async () => {},
            persistSections,
        });
        queue.queueSections('a.md', [edit('a', 'alpha')]);
        queue.queueSections('b.md', [edit('b', 'beta')]);
        await vi.advanceTimersByTimeAsync(2000);
        expect(persistSections.mock.calls).toEqual([
            ['a.md', [edit('a', 'alpha')]],
            ['b.md', [edit('b', 'beta')]],
        ]);
    });

    it('coalesces consecutive edits while retaining the original contents', async () => {
        const persistSections = vi.fn(
            async (_path: string, _edits: SectionContentEdit[]) => {},
        );
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: async () => {},
            persistSections,
        });
        queue.queueSections('a.md', [edit('old', 'first')]);
        queue.queueSections('a.md', [
            edit('first', 'final'),
            edit('two', 'changed', '2'),
        ]);
        await queue.flush('a.md');
        expect(persistSections).toHaveBeenCalledOnce();
        expect(persistSections).toHaveBeenCalledWith('a.md', [
            edit('old', 'final'),
            edit('two', 'changed', '2'),
        ]);
    });

    it('keeps edits arriving during a write separate', async () => {
        let finish!: () => void;
        const writes: SectionContentEdit[][] = [];
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: async () => {},
            persistSections: async (_path, edits) => {
                writes.push(edits.map((item) => ({ ...item })));
                if (writes.length === 1)
                    await new Promise<void>((resolve) => {
                        finish = resolve;
                    });
            },
        });
        queue.queueSections('a.md', [edit('old', 'first')]);
        const flushing = queue.flush('a.md');
        await Promise.resolve();
        await Promise.resolve();
        queue.queueSections('a.md', [edit('first', 'second')]);
        finish();
        await flushing;
        expect(writes).toEqual([
            [edit('old', 'first')],
            [edit('first', 'second')],
        ]);
    });

    it('preserves the order of structural and section edits', async () => {
        const writes: string[] = [];
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: async () => {
                writes.push('structure');
            },
            persistSections: async () => {
                writes.push('section');
            },
        });
        queue.queueStructure('a.md', 'new structure', {
            actionType: 'test',
            addedSections: ['1.1'],
            removedSections: [],
            changedSections: [],
            beforeContentBySection: {},
        });
        queue.queueSections('a.md', [edit('', 'new content', '1.1')]);
        await queue.flush('a.md');
        expect(writes).toEqual(['structure', 'section']);
    });

    it('retains conflicting queued edits and reports each after failure', async () => {
        const onError = vi.fn((_args: { edits?: SectionContentEdit[] }) => {});
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: async () => {},
            persistSections: async () => {
                throw new Error('conflict');
            },
            onError,
        });
        queue.queueSections('a.md', [edit('old', 'first')]);
        queue.queueSections('a.md', [edit('other', 'second')]);
        await expect(queue.flush('a.md')).rejects.toThrow('conflict');
        expect(onError.mock.calls.map(([args]) => args.edits)).toEqual([
            [edit('old', 'first')],
            [edit('other', 'second')],
        ]);
        onError.mockClear();
        queue.queueSections('a.md', [edit('second', 'new draft')]);
        await expect(queue.flush('a.md')).rejects.toThrow('conflict');
        await expect(queue.flush('a.md')).rejects.toThrow('conflict');
        expect(onError.mock.calls.map(([args]) => args.edits)).toEqual([
            [edit('second', 'new draft')],
        ]);
    });

    it('retries failed edits without blocking other files', async () => {
        let failA = true;
        const persisted: string[] = [];
        const queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: async () => {},
            persistSections: async (path) => {
                if (path === 'a.md' && failA) throw new Error('disk busy');
                persisted.push(path);
            },
        });
        queue.queueSections('a.md', [edit('a', 'alpha')]);
        queue.queueSections('b.md', [edit('b', 'beta')]);
        await vi.advanceTimersByTimeAsync(2000);
        await expect(queue.flushAll()).rejects.toThrow('disk busy');
        expect(persisted).toEqual(['b.md']);
        failA = false;
        await queue.flush('a.md');
        expect(persisted).toEqual(['b.md', 'a.md']);
    });
});
