import { describe, expect, it, vi } from 'vitest';
import { WorkerPromise } from 'src/helpers/worker-promise';

type WorkerEventName = 'message' | 'error' | 'messageerror';

class FakeWorker {
    private listeners: Record<WorkerEventName, Set<(event: unknown) => void>> = {
        message: new Set(),
        error: new Set(),
        messageerror: new Set(),
    };
    private terminated = false;

    addEventListener(event: WorkerEventName, listener: (event: unknown) => void) {
        this.listeners[event].add(listener);
    }

    removeEventListener(
        event: WorkerEventName,
        listener: (event: unknown) => void,
    ) {
        this.listeners[event].delete(listener);
    }

    postMessage(_data: unknown, _transfer?: unknown[]) {}

    terminate() {
        this.terminated = true;
    }

    emitMessage(id: number, payload: unknown) {
        for (const listener of this.listeners.message) {
            listener({ data: { id, payload } });
        }
    }

    emitError(message: string) {
        for (const listener of this.listeners.error) {
            listener({ message, error: new Error(message) });
        }
    }

    isTerminated() {
        return this.terminated;
    }
}

describe('WorkerPromise', () => {
    it('resolves with worker payload', async () => {
        const worker = new FakeWorker();
        const workerPromise = new WorkerPromise<{ x: number }, number>(
            worker as unknown as Worker,
        );
        const promise = workerPromise.run({ x: 1 });

        worker.emitMessage(0, 42);

        await expect(promise).resolves.toBe(42);
    });

    it('rejects pending promises when terminated', async () => {
        const worker = new FakeWorker();
        const workerPromise = new WorkerPromise<{ x: number }, number>(
            worker as unknown as Worker,
        );
        const promise = workerPromise.run({ x: 1 });

        workerPromise.terminate();

        await expect(promise).rejects.toThrow('Worker terminated');
        expect(worker.isTerminated()).toBe(true);
    });

    it('rejects all pending promises on worker error', async () => {
        const worker = new FakeWorker();
        const workerPromise = new WorkerPromise<{ x: number }, number>(
            worker as unknown as Worker,
        );
        const promiseA = workerPromise.run({ x: 1 });
        const promiseB = workerPromise.run({ x: 2 });

        worker.emitError('boom');

        await expect(promiseA).rejects.toThrow('boom');
        await expect(promiseB).rejects.toThrow('boom');
    });

    it('posts transferable shared payload', async () => {
        const worker = new FakeWorker();
        const postMessageSpy = vi.spyOn(worker, 'postMessage');
        const workerPromise = new WorkerPromise<{ x: number }, number, ArrayBuffer>(
            worker as unknown as Worker,
        );
        const shared = new ArrayBuffer(8);

        const promise = workerPromise.run({ x: 1 }, shared);
        worker.emitMessage(0, 1);

        await expect(promise).resolves.toBe(1);
        expect(postMessageSpy).toHaveBeenCalledWith({ id: 0, payload: { x: 1 } }, [
            shared,
        ]);
    });
});
