import { MandalaView } from 'src/view/view';
import { derived } from 'src/shared/store/derived';

export const zoomLevelStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.zoomLevel);
