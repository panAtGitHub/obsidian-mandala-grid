import { compareSectionIds, serializeSections } from 'src/engine/mandala-document';
import {
    MandalaGridDocument,
    Sections,
} from 'src/mandala-document/state/document-state-type';
import {
    collectSubtreeSections,
    collapseToRootSections,
    getSortedUniqueSectionsFromNodes,
} from 'src/lib/mandala/section-export';

export const mapBranchesToText = (
    document: MandalaGridDocument,
    sections: Sections,
    nodes: Array<string>,
    format: 'sections' | 'unformatted-text',
) => {
    const selectedSections = getSortedUniqueSectionsFromNodes(sections, nodes);
    const rootSections = collapseToRootSections(selectedSections);
    if (rootSections.length === 0) return '';
    const orderedSections = Object.keys(sections.section_id).sort(compareSectionIds);
    const subtreeSections = collectSubtreeSections(orderedSections, rootSections);

    const serializableSections = subtreeSections.map((sectionId) => {
        const nodeId = sections.section_id[sectionId];
        return {
            sectionId,
            content: nodeId ? document.content[nodeId]?.content ?? '' : '',
        };
    });

    const isSingleNodeWithoutSubtree =
        rootSections.length === 1 &&
        subtreeSections.length === 1 &&
        subtreeSections[0] === rootSections[0];
    if (isSingleNodeWithoutSubtree) {
        return serializableSections[0].content;
    }
    if (format === 'sections') {
        return serializeSections(serializableSections);
    }
    if (format === 'unformatted-text') {
        return serializableSections.map((section) => section.content).join('\n\n');
    }
    throw new Error('Invalid format');
};
