import {
    PinnedNodesState,
    Sections,
} from 'src/mandala-document/state/document-state-type';
import { sortNodeIdsBySectionNumber } from 'src/mandala-document/tree-utils/sort/sort-node-ids-by-section-number';

export type PinNodeAction = {
    type: 'document/pinned-nodes/pin';
    payload: {
        id: string;
    };
};

export const pinNode = (
    sections: Sections,
    pinnedNodes: PinnedNodesState,
    id: string,
) => {
    pinnedNodes.Ids.push(id);
    pinnedNodes.Ids = sortNodeIdsBySectionNumber(sections, pinnedNodes.Ids);
};
