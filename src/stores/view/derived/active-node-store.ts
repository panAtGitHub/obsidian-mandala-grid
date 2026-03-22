import { MandalaView } from 'src/view/view';
import { derived } from 'src/shared/store/derived';

export const activeNodeStore = (view: MandalaView) =>
    derived(view.viewStore, (state) => state.document.activeNode);
