import { MandalaView } from 'src/view/view';
import type { Nx9ActiveCell } from 'src/mandala-scenes/view-nx9/context';

export type ActiveCellNx9 = Nx9ActiveCell | null;

export const setActiveCellNx9 = (view: MandalaView, cell: ActiveCellNx9) => {
    view.mandalaActiveCellNx9 = cell;
    view.viewStore.dispatch({
        type: 'view/mandala/nx9-active-cell/set',
        payload: { cell },
    });
};
