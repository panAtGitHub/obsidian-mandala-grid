import {
    PinnedNodesState,
    Sections,
} from 'src/mandala-document/state/document-state-type';

import { sortNodeIdsBySectionNumber } from 'src/mandala-document/tree-utils/sort/sort-node-ids-by-section-number';

export type RemoveStalePinnedNodesAction = {
    type: 'document/pinned-nodes/remove-stale-nodes';
};

export const removeStalePinnedNodes = (
    pinnedNodes: PinnedNodesState,
    sections: Sections,
) => {
    pinnedNodes.Ids = pinnedNodes.Ids.filter((id) => sections.id_section[id]);
    pinnedNodes.Ids = sortNodeIdsBySectionNumber(sections, pinnedNodes.Ids);
};
