import { compareSectionIds } from 'src/mandala-document/engine/section-utils';
import { Sections } from 'src/mandala-document/state/document-state-type';

const isSameOrDescendantSection = (candidate: string, root: string) =>
    candidate === root || candidate.startsWith(`${root}.`);

export const getSortedUniqueSectionsFromNodes = (
    sections: Sections,
    nodeIds: string[],
) =>
    Array.from(
        new Set(
            nodeIds
                .map((nodeId) => sections.id_section[nodeId])
                .filter((sectionId): sectionId is string => Boolean(sectionId)),
        ),
    ).sort(compareSectionIds);

export const collapseToRootSections = (sectionIds: string[]) => {
    const roots: string[] = [];
    for (const sectionId of sectionIds.sort(compareSectionIds)) {
        if (roots.some((root) => isSameOrDescendantSection(sectionId, root))) {
            continue;
        }
        roots.push(sectionId);
    }
    return roots;
};

export const collectSubtreeSections = (
    allSectionIds: string[],
    roots: string[],
) =>
    allSectionIds.filter((sectionId) =>
        roots.some((root) => isSameOrDescendantSection(sectionId, root)),
    );
