import { MandalaView } from 'src/view/view';
import { derived } from 'src/shared/store/derived';

export const ConflictingHotkeys = (view: MandalaView) =>
    derived(view.viewStore, (state) => state.hotkeys.conflictingHotkeys);

export const HotkeysSearchTerm = (view: MandalaView) =>
    derived(view.viewStore, (state) => state.hotkeys.searchTerm);
