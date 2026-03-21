import { MandalaView } from 'src/view/view';
import { derived } from 'src/lib/store/derived';

export const uiControlsStore = (view: MandalaView) =>
    derived(view.viewStore, (state) => state.ui.controls);
