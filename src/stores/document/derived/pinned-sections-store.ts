import { derived } from 'src/lib/store/derived';
import { createPinnedSectionSet } from 'src/view/helpers/mandala/section-colors';
import { MandalaView } from 'src/view/view';

export const PinnedSectionsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) =>
        createPinnedSectionSet(state.sections, state.pinnedNodes.Ids),
    );
