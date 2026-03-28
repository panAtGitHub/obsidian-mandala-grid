import { describe, expect, it } from 'vitest';
import { createSceneCacheCleaner } from 'src/mandala-scenes/shared/scene-cache-cleanup';

type ActiveCell9x9 = { row: number; col: number } | null;
type ActiveCellNx9 = { row: number; col: number; page?: number } | null;
type ActiveCellWeek = { row: number; col: number } | null;

const createView = () => {
    let activeCell9x9: ActiveCell9x9 = { row: 0, col: 0 };
    let activeCellNx9: ActiveCellNx9 = { row: 1, col: 1, page: 0 };
    let activeCellWeek: ActiveCellWeek = { row: 2, col: 2 };

    return {
        viewStore: {
            dispatch: ({
                type,
                payload,
            }: {
                type: string;
                payload: { cell?: ActiveCellWeek };
            }) => {
                if (type === 'view/mandala/week-active-cell/set') {
                    activeCellWeek = payload.cell ?? null;
                    activeCellNx9 = payload.cell
                        ? {
                              row: payload.cell.row,
                              col: payload.cell.col,
                              page: 0,
                          }
                        : null;
                }
            },
        },
        get mandalaActiveCell9x9() {
            return activeCell9x9;
        },
        set mandalaActiveCell9x9(cell: ActiveCell9x9) {
            activeCell9x9 = cell;
        },
        get mandalaActiveCellNx9() {
            return activeCellNx9;
        },
        set mandalaActiveCellNx9(cell: ActiveCellNx9) {
            activeCellNx9 = cell;
        },
        get mandalaActiveCellWeek7x9() {
            return activeCellWeek;
        },
    };
};

describe('scene-cache-cleanup', () => {
    it('clears inactive scene caches only when committed scene changes', () => {
        const cleaner = createSceneCacheCleaner();
        const view = createView();

        cleaner(view as never, {
            viewKind: '3x3',
            variant: 'default',
        });

        expect(view.mandalaActiveCell9x9).toBe(null);
        expect(view.mandalaActiveCellNx9).toBe(null);
        expect(view.mandalaActiveCellWeek7x9).toBe(null);

        view.mandalaActiveCell9x9 = { row: 4, col: 4 };
        view.mandalaActiveCellNx9 = { row: 5, col: 5, page: 0 };
        view.viewStore.dispatch({
            type: 'view/mandala/week-active-cell/set',
            payload: { cell: { row: 6, col: 6 } },
        });

        cleaner(view as never, {
            viewKind: '3x3',
            variant: 'default',
        });

        expect(view.mandalaActiveCell9x9).toEqual({ row: 4, col: 4 });
        expect(view.mandalaActiveCellNx9).toEqual({ row: 6, col: 6, page: 0 });
        expect(view.mandalaActiveCellWeek7x9).toEqual({ row: 6, col: 6 });
    });
});
