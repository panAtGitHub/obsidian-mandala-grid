import {
    MandalaGridDocument,
    Sections,
} from 'src/mandala-document/state/document-state-type';
import { compareSectionIds } from 'src/engine/mandala-document';
import {
    collectSubtreeSections,
    collapseToRootSections,
    getSortedUniqueSectionsFromNodes,
} from 'src/mandala-display/logic/section-export';

const toOutlineLine = (sectionId: string, content: string) => {
    const depth = Math.max(0, sectionId.split('.').length - 1);
    const indent = '\t'.repeat(depth);
    const lines = content.split('\n');
    if (lines.length === 0) {
        return `${indent}- `;
    }
    return lines
        .map((line, index) =>
            index === 0 ? `${indent}- ${line}` : `${indent}  ${line}`,
        )
        .join('\n');
};

export const getSearchResultsFromDocument = (
    results: string[],
    document: MandalaGridDocument,
    sections: Sections,
) => {
    const selectedSections = getSortedUniqueSectionsFromNodes(sections, results);
    const rootSections = collapseToRootSections(selectedSections);
    if (rootSections.length === 0) return '';

    const orderedSections = Object.keys(sections.section_id).sort(compareSectionIds);
    const subtreeSections = collectSubtreeSections(orderedSections, rootSections);

    const isSingleNodeWithoutSubtree =
        rootSections.length === 1 &&
        subtreeSections.length === 1 &&
        subtreeSections[0] === rootSections[0];
    if (isSingleNodeWithoutSubtree) {
        const nodeId = sections.section_id[subtreeSections[0]];
        return nodeId ? document.content[nodeId]?.content ?? '' : '';
    }

    return subtreeSections
        .map((sectionId) => {
            const nodeId = sections.section_id[sectionId];
            return toOutlineLine(
                sectionId,
                nodeId ? document.content[nodeId]?.content ?? '' : '',
            );
        })
        .join('\n');
};
