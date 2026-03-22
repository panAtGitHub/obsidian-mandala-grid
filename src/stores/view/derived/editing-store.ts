import { MandalaView } from 'src/view/view';
import { derived } from 'src/shared/store/derived';

export const documentStateStore = (view: MandalaView) =>
    derived(view.viewStore, (state) => state.document.editing);
