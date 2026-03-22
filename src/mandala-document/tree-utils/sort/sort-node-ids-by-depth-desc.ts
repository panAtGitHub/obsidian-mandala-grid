import { Sections } from 'src/mandala-document/state/document-state-type';
import { sortSectionsByDepthDesc } from 'src/mandala-document/tree-utils/sort/sort-sections-by-depth';

export const sortNodeIdsByDepthDesc = (sections: Sections, ids: string[]) => {
    const sectionNumbers = ids.map((id) => sections.id_section[id]);
    const sortedSections = sortSectionsByDepthDesc(sectionNumbers);
    return sortedSections.map((section) => sections.section_id[section]);
};
