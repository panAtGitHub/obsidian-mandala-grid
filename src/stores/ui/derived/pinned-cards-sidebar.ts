import { MandalaView } from 'src/view/view';
import { derived } from 'src/lib/store/derived';

export const ActivePinnedCardStore = (view: MandalaView) =>
    derived(view.viewStore, (state) => state.pinnedNodes.activeNode);
