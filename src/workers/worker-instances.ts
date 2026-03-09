import { WorkerPromise } from 'src/helpers/worker-promise';
import type {
    DocumentProgressProps,
    StatusBarWorkerResult,
} from 'src/obsidian/status-bar/helpers/status-bar.worker';
import * as StatusBarWorkerModule from 'src/obsidian/status-bar/helpers/status-bar.worker';

const resolveWorkerCtor = (module: unknown): (new () => Worker) => {
    return (module as { default: new () => Worker }).default;
};
const StatusBarWorker = resolveWorkerCtor(StatusBarWorkerModule);

export const statusBarWorker = new WorkerPromise<
    DocumentProgressProps,
    StatusBarWorkerResult
>(new StatusBarWorker());
