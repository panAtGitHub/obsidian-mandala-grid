import { MandalaView } from 'src/view/view';
import { clearSelectedNodes } from 'src/stores/view/subscriptions/actions/clear-selected-nodes';

export const updateSelectedNodes = (view: MandalaView) => {
    clearSelectedNodes(view);
};
