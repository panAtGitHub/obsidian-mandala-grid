import type { StructuralMutation } from 'src/mandala-document/runtime/reconcile-structural-mutation';
import type { SectionContentEdit } from 'src/mandala-document/runtime/patch-section-contents';

type PendingSave =
    | { kind: 'structure'; data: string; mutation: StructuralMutation }
    | { kind: 'sections'; edits: SectionContentEdit[] };

type PersistSnapshotQueueOptions = {
    delayMs: number;
    persistStructure: (
        path: string,
        data: string,
        mutation: StructuralMutation,
    ) => Promise<void>;
    persistSections: (
        path: string,
        edits: SectionContentEdit[],
    ) => Promise<void>;
    onError?: (args: {
        path: string;
        data: string;
        edits?: SectionContentEdit[];
        error: unknown;
    }) => Promise<void> | void;
};

export class PersistSnapshotQueue {
    private readonly pendingSnapshots = new Map<string, PendingSave[]>();
    private readonly timers = new Map<string, number>();
    private readonly inflightFlushes = new Map<string, Promise<void>>();
    private readonly reportedFailures = new WeakSet<PendingSave>();

    constructor(private readonly options: PersistSnapshotQueueOptions) {}

    queueStructure(path: string, data: string, mutation: StructuralMutation) {
        const pending = this.pendingSnapshots.get(path) ?? [];
        pending.push({ kind: 'structure', data, mutation });
        this.pendingSnapshots.set(path, pending);
        this.schedule(path);
    }

    queueSections(path: string, edits: SectionContentEdit[]) {
        if (edits.length === 0) return;
        const pending = this.pendingSnapshots.get(path) ?? [];
        const last = pending.at(-1);
        const canMerge =
            last?.kind === 'sections' &&
            !this.inflightFlushes.has(path) &&
            !this.reportedFailures.has(last) &&
            edits.every((edit) => {
                const previous = last.edits.find(
                    (item) => item.sectionId === edit.sectionId,
                );
                return !previous || previous.after === edit.before;
            });
        if (canMerge && last.kind === 'sections') {
            for (const edit of edits) {
                const previous = last.edits.find(
                    (item) => item.sectionId === edit.sectionId,
                );
                if (previous) previous.after = edit.after;
                else last.edits.push({ ...edit });
            }
        } else {
            pending.push({
                kind: 'sections',
                edits: edits.map((edit) => ({ ...edit })),
            });
        }
        this.pendingSnapshots.set(path, pending);
        this.schedule(path);
    }

    private schedule(path: string) {
        this.clearTimer(path);
        this.timers.set(
            path,
            window.setTimeout(() => {
                this.timers.delete(path);
                void this.flush(path).catch(() => undefined);
            }, this.options.delayMs),
        );
    }

    async flush(path: string) {
        this.clearTimer(path);
        const previousFlush =
            this.inflightFlushes.get(path) ?? Promise.resolve();

        let trackedFlush: Promise<void>;
        trackedFlush = previousFlush
            .catch(() => undefined)
            .then(async () => {
                while (this.pendingSnapshots.has(path)) {
                    const pending = this.pendingSnapshots.get(path);
                    if (!pending?.length) return;
                    const snapshot = pending[0];
                    try {
                        if (snapshot.kind === 'sections') {
                            await this.options.persistSections(
                                path,
                                snapshot.edits,
                            );
                        } else {
                            await this.options.persistStructure(
                                path,
                                snapshot.data,
                                snapshot.mutation,
                            );
                        }
                    } catch (error) {
                        if (this.options.onError) {
                            for (const unsaved of pending) {
                                if (this.reportedFailures.has(unsaved))
                                    continue;
                                await this.options.onError({
                                    path,
                                    data:
                                        unsaved.kind === 'structure'
                                            ? unsaved.data
                                            : '',
                                    edits:
                                        unsaved.kind === 'sections'
                                            ? unsaved.edits
                                            : undefined,
                                    error,
                                });
                                this.reportedFailures.add(unsaved);
                            }
                        }
                        throw error;
                    }
                    pending.shift();
                    if (pending.length === 0) {
                        this.pendingSnapshots.delete(path);
                    }
                }
            })
            .finally(() => {
                if (this.inflightFlushes.get(path) === trackedFlush) {
                    this.inflightFlushes.delete(path);
                }
            });

        this.inflightFlushes.set(path, trackedFlush);
        return trackedFlush;
    }

    async flushAll() {
        const paths = new Set<string>([
            ...this.pendingSnapshots.keys(),
            ...this.timers.keys(),
            ...this.inflightFlushes.keys(),
        ]);
        const errors: unknown[] = [];

        await Promise.all(
            Array.from(paths, async (path) => {
                try {
                    await this.flush(path);
                } catch (error) {
                    errors.push(error);
                }
            }),
        );

        if (errors.length > 0) {
            throw errors[0];
        }
    }

    private clearTimer(path: string) {
        const timer = this.timers.get(path);
        if (timer) {
            window.clearTimeout(timer);
            this.timers.delete(path);
        }
    }
}
