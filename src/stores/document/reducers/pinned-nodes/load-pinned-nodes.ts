import {
    PinnedNodesState,
    Sections,
} from 'src/stores/document/document-state-type';

export type LoadPinnedNodesAction = {
    type: 'document/pinned-nodes/load-from-settings';
    payload: {
        sections: string[];
    };
};

export const loadPinnedNodes = (
    pinnedNodes: PinnedNodesState,
    sections: Sections,
    pinnedSections: string[],
) => {
    pinnedNodes.Ids = pinnedSections
        .map((section) => sections.section_id[section])
        .filter((x) => x);
};
