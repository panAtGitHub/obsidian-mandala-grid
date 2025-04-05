import { Sections } from 'src/stores/document/document-state-type';
import { sortSections } from 'src/lib/tree-utils/sort/sort-sections';

export const findNextNode = (
    sections: Sections,
    node: string,
    direction: 'back' | 'forward',
    hiddenNodes: Set<string> | null,
) => {
    let sortedSections = sortSections(Object.keys(sections.section_id));
    if (hiddenNodes) {
        sortedSections = sortedSections.filter(
            (section) => !hiddenNodes.has(sections.section_id[section]),
        );
    }
    const currentSection = sections.id_section[node];
    const currentSectionIndex = sortedSections.findIndex(
        (section) => currentSection === section,
    );
    if (currentSectionIndex === -1) return node;

    const nextSectionIndex =
        currentSectionIndex + (direction === 'back' ? -1 : +1);
    const nextSection = sortedSections[nextSectionIndex];
    return sections.section_id[nextSection] || node;
};
