import type { CellGridPosition } from 'src/mandala-cell/model/card-types';
import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';
import { setActiveCellWeek7x9 } from 'src/mandala-interaction/helpers/set-active-cell-week-7x9';
import { setActiveCellNx9 } from 'src/view/helpers/mandala/nx9/set-active-cell';
import type { MandalaView } from 'src/view/view';

export const activateMandalaGridCell = (
    view: MandalaView,
    gridCell: CellGridPosition | null,
) => {
    if (!gridCell) {
        return;
    }

    if (gridCell.mode === 'week-7x9') {
        setActiveCellWeek7x9(view, {
            row: gridCell.row,
            col: gridCell.col,
        });
        return;
    }

    if (gridCell.mode === 'nx9') {
        setActiveCellNx9(view, {
            row: gridCell.row,
            col: gridCell.col,
            page: gridCell.page,
        });
        return;
    }

    setActiveCell9x9(view, {
        row: gridCell.row,
        col: gridCell.col,
    });
};
