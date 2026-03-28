import type { MandalaView } from 'src/view/view';

type Nx9WeekActiveCell = { row: number; col: number; page?: number } | null;

export const setActiveCellNx9Week7x9 = (
    view: MandalaView,
    cell: Nx9WeekActiveCell,
) => {
    view.viewStore.dispatch({
        type: 'view/mandala/week-active-cell/set',
        payload: {
            cell: cell
                ? {
                      row: cell.row,
                      col: cell.col,
                  }
                : null,
        },
    });
};
