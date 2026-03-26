import { describe, expect, it } from 'vitest';
import {
    createNx9HydrationRuntime,
    resolveNx9FutureScale,
} from 'src/mandala-scenes/view-nx9/hydration-runtime';
import type { Nx9PageFrameRowViewModel } from 'src/mandala-scenes/view-nx9/assemble-cell-view-model';

const pageFrame: Nx9PageFrameRowViewModel[] = [
    Array.from({ length: 2 }, (_, col) => ({
        kind: 'real-cell' as const,
        key: `0-${col}`,
        row: 0,
        col,
        section: col === 0 ? '1' : `1.${col}`,
        nodeId: col === 0 ? 'node-1' : 'node-1-1',
        isTopEdge: true,
        isBottomEdge: false,
        isLeftEdge: col === 0,
        isRightEdge: col === 1,
    })),
];

describe('nx9-hydration-runtime', () => {
    it('seeds hydration with the active node and expands on scheduled frames', () => {
        const queue: Array<() => void> = [];
        const runtime = createNx9HydrationRuntime({
            scheduleFrame: (callback) => queue.push(callback),
        });

        const initial = runtime.sync({
            revision: 1,
            currentPage: 0,
            rowCount: 5,
            pageFrame,
            activeNodeId: 'node-1-1',
        });

        expect(initial).toEqual(new Set(['node-1-1']));
        expect(queue).toHaveLength(1);

        queue.shift()?.();
        expect(queue).toHaveLength(1);
        queue.shift()?.();

        const expanded = runtime.sync({
            revision: 1,
            currentPage: 0,
            rowCount: 5,
            pageFrame,
            activeNodeId: 'node-1-1',
        });
        expect(expanded).toEqual(new Set(['node-1', 'node-1-1']));
    });

    it('computes future row scale from visible row count', () => {
        expect(resolveNx9FutureScale(5)).toBe(1);
        expect(resolveNx9FutureScale(8)).toBeLessThan(1);
        expect(resolveNx9FutureScale(20)).toBeGreaterThanOrEqual(0.58);
    });
});
