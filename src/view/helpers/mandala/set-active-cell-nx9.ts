import { MandalaView } from 'src/view/view';

export type ActiveCellNx9 = { row: number; col: number } | null;

export const setActiveCellNx9 = (view: MandalaView, cell: ActiveCellNx9) => {
    view.mandalaActiveCellNx9 = cell;
    view.viewStore.dispatch({
        type: 'view/mandala/nx9-active-cell/set',
        payload: { cell },
    });
};
