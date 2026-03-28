import { setActiveCellNx9Week7x9 } from 'src/mandala-scenes/view-nx9-week-7x9/set-active-cell';
import { MandalaView } from 'src/view/view';

export type ActiveCellWeek7x9 = { row: number; col: number } | null;

export const setActiveCellWeek7x9 = (
    view: MandalaView,
    cell: ActiveCellWeek7x9,
) => setActiveCellNx9Week7x9(view, cell);
