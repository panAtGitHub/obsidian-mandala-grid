import { MandalaView } from 'src/view/view';

export type ActiveCell9x9 = { row: number; col: number } | null;

export const setActiveCell9x9 = (view: MandalaView, cell: ActiveCell9x9) => {
    view.mandalaActiveCell9x9 = cell;
    view.viewStore.dispatch({
        type: 'view/mandala/active-cell/set',
        payload: { cell },
    });
};
