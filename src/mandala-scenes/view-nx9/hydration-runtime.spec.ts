import { describe, expect, it, vi } from 'vitest';
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
    it('keeps the current page cold first and promotes hot pages sequentially', () => {
        const queue: Array<() => void> = [];
        const onHydrationChange = vi.fn();
        const runtime = createNx9HydrationRuntime({
            scheduleFrame: (callback) => queue.push(callback),
            onHydrationChange,
        });

        const initial = runtime.sync({
            revision: 1,
            currentPage: 0,
            rowCount: 5,
            hotPages: [0],
            pageFramesByPage: new Map([[0, pageFrame]]),
        });

        expect(initial.hydratedNodeIdsByPage.get(0)).toEqual(new Set());
        expect(queue).toHaveLength(1);

        queue.shift()?.();
        expect(queue).toHaveLength(1);
        queue.shift()?.();

        const expanded = runtime.sync({
            revision: 1,
            currentPage: 0,
            rowCount: 5,
            hotPages: [0],
            pageFramesByPage: new Map([[0, pageFrame]]),
        });
        expect(expanded.hydratedNodeIdsByPage.get(0)).toEqual(
            new Set(['node-1', 'node-1-1']),
        );
        expect(expanded.hotPages.has(0)).toBe(true);
        expect(onHydrationChange).toHaveBeenCalledTimes(1);
    });

    it('drops pages outside the current hot window', () => {
        const queue: Array<() => void> = [];
        const runtime = createNx9HydrationRuntime({
            scheduleFrame: (callback) => queue.push(callback),
        });

        runtime.sync({
            revision: 1,
            currentPage: 0,
            rowCount: 5,
            hotPages: [0, 1],
            pageFramesByPage: new Map([
                [0, pageFrame],
                [1, pageFrame],
            ]),
        });

        while (queue.length > 0) {
            queue.shift()?.();
        }

        const next = runtime.sync({
            revision: 1,
            currentPage: 1,
            rowCount: 5,
            hotPages: [1],
            pageFramesByPage: new Map([[1, pageFrame]]),
        });

        expect(next.hydratedNodeIdsByPage.has(0)).toBe(false);
        expect(next.hydratedNodeIdsByPage.has(1)).toBe(true);
    });

    it('computes future row scale from visible row count', () => {
        expect(resolveNx9FutureScale(5)).toBe(1);
        expect(resolveNx9FutureScale(8)).toBeLessThan(1);
        expect(resolveNx9FutureScale(20)).toBeGreaterThanOrEqual(0.58);
    });
});
