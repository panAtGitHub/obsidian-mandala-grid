import { LineageView } from 'src/view/view';

export const clearSelectedNodes = (view: LineageView) => {
    view.viewStore.dispatch({ type: 'view/selection/clear-selection' });
};
