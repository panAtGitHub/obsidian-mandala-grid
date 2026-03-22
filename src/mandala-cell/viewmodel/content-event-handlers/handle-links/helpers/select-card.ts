import { MandalaView } from 'src/view/view';
import { delay } from 'src/helpers/delay';
import { findNodeColumn } from 'src/lib/tree-utils/find/find-node-column';

export const selectCard = async (view: MandalaView, id: string) => {
    await delay(16);
    const columns = view.documentStore.getValue().document.columns;
    if (findNodeColumn(columns, id) < 0) return;
    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse',
        payload: {
            id: id,
        },
    });
};
