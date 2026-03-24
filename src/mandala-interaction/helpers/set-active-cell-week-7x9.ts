import { MandalaView } from 'src/view/view';

export type ActiveCellWeek7x9 = { row: number; col: number } | null;

export const setActiveCellWeek7x9 = (
    view: MandalaView,
    cell: ActiveCellWeek7x9,
) => {
    view.viewStore.dispatch({
        type: 'view/mandala/week-active-cell/set',
        payload: { cell },
    });
};
