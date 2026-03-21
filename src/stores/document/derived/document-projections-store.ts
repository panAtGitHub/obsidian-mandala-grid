import { derived } from 'src/lib/store/derived';
import { createPinnedSectionSet } from 'src/view/helpers/mandala/section-colors';
import { MandalaView } from 'src/view/view';

export const IdSectionStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.sections.id_section);

export const GroupParentIdsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.meta.groupParentIds);

export const PinnedNodesStore = (view: MandalaView) =>
    derived(view.documentStore, (state) => state.pinnedNodes.Ids);

export const PinnedSectionsStore = (view: MandalaView) =>
    derived(view.documentStore, (state) =>
        createPinnedSectionSet(state.sections, state.pinnedNodes.Ids),
    );
