import { Sections } from 'src/mandala-document/state/document-state-type';
import { sortSections } from 'src/mandala-document/tree-utils/sort/sort-sections';

export const sortNodeIdsBySectionNumber = (
    sections: Sections,
    ids: string[],
) => {
    const pinnedSections = ids.map((id) => sections.id_section[id]);
    const sortedSections = sortSections(pinnedSections);
    return sortedSections.map((section) => sections.section_id[section]);
};
