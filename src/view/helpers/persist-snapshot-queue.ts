type PersistSnapshotQueueOptions = {
    delayMs: number;
    persist: (path: string, data: string) => Promise<void>;
    onError?: (args: {
        path: string;
        data: string;
        error: unknown;
    }) => Promise<void> | void;
};

export class PersistSnapshotQueue {
    private readonly pendingSnapshots = new Map<string, string>();
    private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
    private readonly inflightFlushes = new Map<string, Promise<void>>();

    constructor(private readonly options: PersistSnapshotQueueOptions) {}

    queue(path: string, data: string) {
        this.pendingSnapshots.set(path, data);
        this.clearTimer(path);
        this.timers.set(
            path,
            globalThis.setTimeout(() => {
                this.timers.delete(path);
                void this.flush(path).catch(() => undefined);
            }, this.options.delayMs),
        );
    }

    async flush(path: string) {
        this.clearTimer(path);
        const previousFlush = this.inflightFlushes.get(path) ?? Promise.resolve();

        let trackedFlush: Promise<void>;
        trackedFlush = previousFlush
            .catch(() => undefined)
            .then(async () => {
                while (this.pendingSnapshots.has(path)) {
                    const data = this.pendingSnapshots.get(path);
                    if (typeof data !== 'string') return;
                    try {
                        await this.options.persist(path, data);
                    } catch (error) {
                        if (this.options.onError) {
                            await this.options.onError({ path, data, error });
                        }
                        throw error;
                    }
                    if (this.pendingSnapshots.get(path) === data) {
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
            globalThis.clearTimeout(timer);
            this.timers.delete(path);
        }
    }
}
