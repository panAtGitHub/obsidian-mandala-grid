import { describe, expect, it } from 'vitest';
import { PerfRecorder } from 'src/perf/perf-recorder';

describe('PerfRecorder exportSnapshot', () => {
    it('writes archive and latest snapshot files, then clears the buffer', async () => {
        const recorder = new PerfRecorder({
            pluginVersion: '1.2.8.7',
            runtimeEnv: 'development',
            sessionId: 'session-export-1',
            now: () => 100,
        });
        const ensuredPaths: string[] = [];
        const writtenFiles = new Map<string, string>();

        recorder.record('view.save-document', { save_total_ms: 12.3 });

        const result = await recorder.exportSnapshot({
            directoryPath: '.obsidian/mandala-grid/perf',
            ensureFolderRecursive: async (path) => {
                ensuredPaths.push(path);
            },
            writeFile: async (path, data) => {
                writtenFiles.set(path, data);
            },
            exportedAt: new Date(2026, 2, 23, 1, 2, 3),
        });

        expect(ensuredPaths).toEqual(['.obsidian/mandala-grid/perf']);
        expect(result).toEqual({
            archivePath:
                '.obsidian/mandala-grid/perf/mandala-grid-perf-20260323-010203.json',
            latestPath: '.obsidian/mandala-grid/perf/latest.json',
            eventCount: 1,
        });
        expect(Array.from(writtenFiles.keys())).toEqual([
            '.obsidian/mandala-grid/perf/mandala-grid-perf-20260323-010203.json',
            '.obsidian/mandala-grid/perf/latest.json',
        ]);
        expect(
            JSON.parse(
                writtenFiles.get(
                    '.obsidian/mandala-grid/perf/mandala-grid-perf-20260323-010203.json',
                ) ?? '{}',
            ),
        ).toMatchObject({
            schemaVersion: 1,
            eventCount: 1,
            events: [{ name: 'view.save-document' }],
        });
        expect(recorder.getEventCount()).toBe(0);
    });

    it('keeps buffered events when export fails', async () => {
        const recorder = new PerfRecorder({
            pluginVersion: '1.2.8.7',
            runtimeEnv: 'production',
            sessionId: 'session-export-2',
            now: () => 200,
        });

        recorder.record('view.first-render', { first_render_ms: 33.1 });

        await expect(
            recorder.exportSnapshot({
                directoryPath: '.obsidian/mandala-grid/perf',
                ensureFolderRecursive: async () => undefined,
                writeFile: async (path) => {
                    if (path.endsWith('latest.json')) {
                        throw new Error('disk busy');
                    }
                },
                exportedAt: new Date(2026, 2, 23, 1, 2, 4),
            }),
        ).rejects.toThrow('disk busy');

        expect(recorder.getEventCount()).toBe(1);
    });

    it('overwrites latest.json on later exports', async () => {
        const recorder = new PerfRecorder({
            pluginVersion: '1.2.8.7',
            runtimeEnv: 'development',
            sessionId: 'session-export-3',
            now: () => 300,
        });
        const writtenFiles = new Map<string, string>();

        const writeFile = async (path: string, data: string) => {
            writtenFiles.set(path, data);
        };

        recorder.record('event-1', { value: 1 });
        await recorder.exportSnapshot({
            directoryPath: '.obsidian/mandala-grid/perf',
            ensureFolderRecursive: async () => undefined,
            writeFile,
            exportedAt: new Date(2026, 2, 23, 1, 2, 3),
        });

        recorder.record('event-2', { value: 2 });
        await recorder.exportSnapshot({
            directoryPath: '.obsidian/mandala-grid/perf',
            ensureFolderRecursive: async () => undefined,
            writeFile,
            exportedAt: new Date(2026, 2, 23, 1, 2, 5),
        });

        expect(
            JSON.parse(
                writtenFiles.get('.obsidian/mandala-grid/perf/latest.json') ??
                    '{}',
            ),
        ).toMatchObject({
            eventCount: 1,
            events: [{ name: 'event-2' }],
        });
    });
});
