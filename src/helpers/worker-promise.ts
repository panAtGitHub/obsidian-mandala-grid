export class WorkerPromise<Input, Output, Shared = never> {
    private id = 0;
    private worker: Worker;
    private pending = new Map<
        number,
        {
            resolve: (value: Output | PromiseLike<Output>) => void;
            reject: (reason?: unknown) => void;
        }
    >();
    private terminated = false;

    constructor(worker: Worker) {
        this.worker = worker;
        this.worker.addEventListener('message', this.onMessage);
        this.worker.addEventListener('error', this.onError);
        this.worker.addEventListener('messageerror', this.onMessageError);
    }

    run = (payload: Input, shared?: Shared) => {
        return new Promise<Output>((resolve, reject) => {
            if (this.terminated) {
                reject(new Error('Worker already terminated'));
                return;
            }
            const id = this.nextId();
            this.pending.set(id, { resolve, reject });
            if (shared !== undefined) {
                // @ts-ignore
                this.worker.postMessage({ id, payload }, [shared]);
            } else this.worker.postMessage({ id, payload });
        });
    };

    terminate = () => {
        this.terminated = true;
        this.worker.removeEventListener('message', this.onMessage);
        this.worker.removeEventListener('error', this.onError);
        this.worker.removeEventListener('messageerror', this.onMessageError);
        const error = new Error('Worker terminated');
        for (const { reject } of this.pending.values()) {
            reject(error);
        }
        this.pending.clear();
        this.worker.terminate();
    };

    private nextId = () => {
        const max = Number.MAX_SAFE_INTEGER;
        while (this.pending.has(this.id)) {
            this.id = this.id >= max ? 0 : this.id + 1;
        }
        const next = this.id;
        this.id = this.id >= max ? 0 : this.id + 1;
        return next;
    };

    private onMessage = (
        message: MessageEvent<{ id: number; payload: Output }>,
    ) => {
        const id = message.data.id;
        const pending = this.pending.get(id);
        if (pending) {
            pending.resolve(message.data.payload);
            this.pending.delete(id);
        }
    };

    private onError = (error: ErrorEvent) => {
        for (const { reject } of this.pending.values()) {
            reject(error.error || new Error(error.message));
        }
        this.pending.clear();
    };

    private onMessageError = () => {
        const error = new Error('Worker message deserialization failed');
        for (const { reject } of this.pending.values()) {
            reject(error);
        }
        this.pending.clear();
    };
}
