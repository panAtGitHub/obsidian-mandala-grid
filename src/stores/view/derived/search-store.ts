import { MandalaView } from 'src/view/view';
import { derived } from 'src/shared/store/derived';

export const searchStore = (view: MandalaView) =>
    derived(view.viewStore, (state) => state.search);
