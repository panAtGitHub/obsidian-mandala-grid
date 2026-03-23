export type PerfScalar = string | number | boolean | null;
export type PerfPayload = Record<string, PerfScalar>;

type PerfPayloadInput = Record<string, unknown>;

type PerfRuntimeEnv = 'development' | 'production';

type PerfEventContext = {
    filePath?: string | null;
    mode?: string | null;
};

type PerfRecorderOptions = {
    pluginVersion: string;
    runtimeEnv: PerfRuntimeEnv;
    capacity?: number;
    sessionId?: string;
    now?: () => number;
    scheduleAfterNextPaint?: (callback: () => void) => void;
};

type ExportSnapshotOptions = {
    directoryPath: string;
    ensureFolderRecursive: (path: string) => Promise<void>;
    writeFile: (path: string, data: string) => Promise<void>;
    exportedAt?: Date;
};

export type PerfEvent = {
    seq: number;
    ts: number;
    name: string;
    filePath: string | null;
    mode: string | null;
    payload: PerfPayload;
};

export type PerfSnapshot = {
    schemaVersion: 1;
    captureMode: 'buffered-manual-export';
    sessionId: string;
    exportedAt: string;
    pluginVersion: string;
    runtimeEnv: PerfRuntimeEnv;
    eventCount: number;
    events: PerfEvent[];
};

export type ExportPerfSnapshotResult = {
    archivePath: string;
    latestPath: string;
    eventCount: number;
};

const DEFAULT_CAPACITY = 1000;

const createSessionId = () =>
    `perf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizePerfScalar = (value: unknown): PerfScalar => {
    if (value === null) return null;
    if (typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    return null;
};

const normalizePerfPayload = (payload: PerfPayloadInput = {}): PerfPayload =>
    Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [
            key,
            normalizePerfScalar(value),
        ]),
    );

const defaultScheduleAfterNextPaint = (callback: () => void) => {
    const requestFrame =
        typeof globalThis.requestAnimationFrame === 'function'
            ? (nextFrame: FrameRequestCallback) =>
                  globalThis.requestAnimationFrame(nextFrame)
            : null;
    if (!requestFrame) {
        globalThis.setTimeout(callback, 0);
        return;
    }

    requestFrame(() => {
        requestFrame(() => {
            callback();
        });
    });
};

export const formatPerfSnapshotTimestamp = (date: Date) => {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

export class PerfRecorder {
    private readonly capacity: number;
    private readonly now: () => number;
    private readonly scheduleAfterNextPaint: (callback: () => void) => void;
    private readonly pluginVersion: string;
    private readonly runtimeEnv: PerfRuntimeEnv;
    private readonly sessionId: string;
    private seq = 0;
    private events: PerfEvent[] = [];

    constructor(options: PerfRecorderOptions) {
        this.capacity = options.capacity ?? DEFAULT_CAPACITY;
        this.now = options.now ?? (() => Date.now());
        this.scheduleAfterNextPaint =
            options.scheduleAfterNextPaint ?? defaultScheduleAfterNextPaint;
        this.pluginVersion = options.pluginVersion;
        this.runtimeEnv = options.runtimeEnv;
        this.sessionId = options.sessionId ?? createSessionId();
    }

    record(
        eventName: string,
        payload: PerfPayloadInput = {},
        context: PerfEventContext = {},
    ) {
        this.seq += 1;
        this.events.push({
            seq: this.seq,
            ts: this.now(),
            name: eventName,
            filePath: context.filePath ?? null,
            mode: context.mode ?? null,
            payload: normalizePerfPayload(payload),
        });

        if (this.events.length > this.capacity) {
            this.events.splice(0, this.events.length - this.capacity);
        }
    }

    recordAfterNextPaint(
        eventName: string,
        startedAt: number,
        payload: PerfPayloadInput = {},
        context: PerfEventContext = {},
    ) {
        this.scheduleAfterNextPaint(() => {
            const total_ms = Number((performance.now() - startedAt).toFixed(2));
            this.record(
                eventName,
                {
                    ...payload,
                    total_ms,
                },
                context,
            );
        });
    }

    getEventCount() {
        return this.events.length;
    }

    clear() {
        this.events = [];
    }

    buildSnapshot(exportedAt: Date = new Date()): PerfSnapshot {
        return {
            schemaVersion: 1,
            captureMode: 'buffered-manual-export',
            sessionId: this.sessionId,
            exportedAt: exportedAt.toISOString(),
            pluginVersion: this.pluginVersion,
            runtimeEnv: this.runtimeEnv,
            eventCount: this.events.length,
            events: this.events.map((event) => ({
                ...event,
                payload: { ...event.payload },
            })),
        };
    }

    async exportSnapshot({
        directoryPath,
        ensureFolderRecursive,
        writeFile,
        exportedAt = new Date(),
    }: ExportSnapshotOptions): Promise<ExportPerfSnapshotResult> {
        const snapshot = this.buildSnapshot(exportedAt);
        const archivePath = `${directoryPath}/mandala-grid-perf-${formatPerfSnapshotTimestamp(exportedAt)}.json`;
        const latestPath = `${directoryPath}/latest.json`;
        const data = JSON.stringify(snapshot, null, 2);

        await ensureFolderRecursive(directoryPath);
        await writeFile(archivePath, data);
        await writeFile(latestPath, data);
        this.clear();

        return {
            archivePath,
            latestPath,
            eventCount: snapshot.eventCount,
        };
    }
}
