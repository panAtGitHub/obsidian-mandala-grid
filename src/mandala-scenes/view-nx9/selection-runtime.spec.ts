import { describe, expect, it, vi } from 'vitest';
import { createNx9SelectionRuntime } from 'src/mandala-scenes/view-nx9/selection-runtime';

describe('nx9-selection-runtime', () => {
    it('activates ghost create cells on the current page', () => {
        const view = {
            set mandalaActiveCellNx9(value: unknown) {
                assigned.push(value);
            },
        } as never;
        const assigned: unknown[] = [];
        const runtime = createNx9SelectionRuntime({
            view,
            getCurrentPage: () => 3,
        });

        runtime.selectGhostCreateCell(4);

        expect(assigned).toEqual([{ row: 4, col: 0, page: 3 }]);
    });

    it('activates addressable empty cells and populated cells', () => {
        const assigned: unknown[] = [];
        const view = {
            set mandalaActiveCellNx9(value: unknown) {
                assigned.push(value);
            },
        } as never;
        const getCurrentPage = vi.fn(() => 2);
        const runtime = createNx9SelectionRuntime({
            view,
            getCurrentPage,
        });

        runtime.selectRealCell(1, 2, {
            nodeId: null,
            section: '2.2',
        });
        runtime.selectRealCell(1, 3, {
            nodeId: 'node-1-2',
            section: '2.3',
        });

        expect(getCurrentPage).toHaveBeenCalledTimes(2);
        expect(assigned).toEqual([
            { row: 1, col: 2, page: 2 },
            { row: 1, col: 3, page: 2 },
        ]);
    });

    it('ignores cells that are neither backed by a node nor a section', () => {
        const assigned: unknown[] = [];
        const view = {
            set mandalaActiveCellNx9(value: unknown) {
                assigned.push(value);
            },
        } as never;
        const getCurrentPage = vi.fn(() => 2);
        const runtime = createNx9SelectionRuntime({
            view,
            getCurrentPage,
        });

        runtime.selectRealCell(1, 2, {
            nodeId: null,
            section: null,
        });

        expect(getCurrentPage).not.toHaveBeenCalled();
        expect(assigned).toEqual([]);
    });
});
