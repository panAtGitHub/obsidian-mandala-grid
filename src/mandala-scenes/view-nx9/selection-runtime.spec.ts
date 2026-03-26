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

    it('ignores empty real cells and activates populated cells', () => {
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

        runtime.selectRealCell(1, 2, null);
        runtime.selectRealCell(1, 2, 'node-1-2');

        expect(getCurrentPage).toHaveBeenCalledTimes(1);
        expect(assigned).toEqual([{ row: 1, col: 2, page: 2 }]);
    });
});
