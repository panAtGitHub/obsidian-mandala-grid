import { afterEach, describe, expect, it, vi } from 'vitest';
import { PerfRecorder } from 'src/perf/perf-recorder';

describe('PerfRecorder', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('drops the oldest events when capacity is exceeded', () => {
        const recorder = new PerfRecorder({
            pluginVersion: '1.2.8.7',
            runtimeEnv: 'development',
            sessionId: 'session-1',
            capacity: 2,
            now: vi
                .fn()
                .mockReturnValueOnce(101)
                .mockReturnValueOnce(102)
                .mockReturnValueOnce(103),
        });

        recorder.record('event-1', { value: 1 });
        recorder.record('event-2', { value: 2 });
        recorder.record('event-3', { value: 3 });

        const snapshot = recorder.buildSnapshot(
            new Date('2026-03-23T10:11:12.000Z'),
        );

        expect(snapshot.eventCount).toBe(2);
        expect(snapshot.events.map((event) => event.name)).toEqual([
            'event-2',
            'event-3',
        ]);
        expect(snapshot.events.map((event) => event.seq)).toEqual([2, 3]);
    });

    it('builds a stable snapshot schema with normalized payload values', () => {
        const recorder = new PerfRecorder({
            pluginVersion: '1.2.8.7',
            runtimeEnv: 'production',
            sessionId: 'session-2',
            now: () => 12345,
        });

        recorder.record(
            'view.load-document-to-store',
            {
                count: 9,
                ok: true,
                missing: undefined,
                invalid: Number.NaN,
                nested: { nope: true },
            },
            {
                filePath: 'Projects/demo.md',
                mode: '3x3',
            },
        );

        expect(
            recorder.buildSnapshot(new Date('2026-03-23T10:11:12.000Z')),
        ).toEqual({
            schemaVersion: 1,
            captureMode: 'buffered-manual-export',
            sessionId: 'session-2',
            exportedAt: '2026-03-23T10:11:12.000Z',
            pluginVersion: '1.2.8.7',
            runtimeEnv: 'production',
            eventCount: 1,
            events: [
                {
                    seq: 1,
                    ts: 12345,
                    name: 'view.load-document-to-store',
                    filePath: 'Projects/demo.md',
                    mode: '3x3',
                    payload: {
                        count: 9,
                        ok: true,
                        missing: null,
                        invalid: null,
                        nested: null,
                    },
                },
            ],
        });
    });

    it('records total_ms after the next paint boundary', () => {
        let scheduled: () => void = () => {
            throw new Error('scheduleAfterNextPaint callback was not assigned');
        };
        const performanceNow = vi.spyOn(performance, 'now');
        performanceNow.mockReturnValue(12.5);

        const recorder = new PerfRecorder({
            pluginVersion: '1.2.8.7',
            runtimeEnv: 'development',
            sessionId: 'session-3',
            now: () => 200,
            scheduleAfterNextPaint: (callback) => {
                scheduled = callback;
            },
        });

        recorder.recordAfterNextPaint(
            'interaction.active-node.mouse',
            4.25,
            { to_node_id: 'n2' },
            { mode: '9x9' },
        );

        expect(recorder.getEventCount()).toBe(0);

        performanceNow.mockReturnValue(26.5);
        scheduled();

        expect(recorder.buildSnapshot().events[0]?.payload.total_ms).toBe(22.25);
    });
});
