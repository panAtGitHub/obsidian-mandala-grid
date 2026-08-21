import type { SectionIndex } from 'src/mandala-document/runtime/section-index';
import { getSectionContentFromRange } from 'src/mandala-document/runtime/section-index';

export type WorkingSetSection = {
    id: string;
    nodeId: string;
    content: string;
};

export type WorkingSet = {
    requestedSectionIds: string[];
    materializedSectionIds: string[];
    missingSectionIds: string[];
    sections: Map<string, WorkingSetSection>;
};

export const buildThreeByThreeSectionIds = (centerSection: string) => [
    centerSection,
    ...Array.from({ length: 8 }, (_, index) => `${centerSection}.${index + 1}`),
];

export const materializeWorkingSet = ({
    source,
    index,
    sectionIds,
}: {
    source: string;
    index: SectionIndex;
    sectionIds: Iterable<string>;
}): WorkingSet => {
    const requestedSectionIds = Array.from(new Set(sectionIds));
    const sections = new Map<string, WorkingSetSection>();
    const missingSectionIds: string[] = [];

    for (const id of requestedSectionIds) {
        const range = index.byId.get(id);
        const nodeId = index.sectionToNodeId.get(id);
        if (!range || !nodeId) {
            missingSectionIds.push(id);
            continue;
        }
        sections.set(id, {
            id,
            nodeId,
            content: getSectionContentFromRange(source, range) ?? '',
        });
    }

    return {
        requestedSectionIds,
        materializedSectionIds: Array.from(sections.keys()),
        missingSectionIds,
        sections,
    };
};

export const materializeThreeByThreeWorkingSet = ({
    source,
    index,
    centerSection,
}: {
    source: string;
    index: SectionIndex;
    centerSection: string;
}) =>
    materializeWorkingSet({
        source,
        index,
        sectionIds: buildThreeByThreeSectionIds(centerSection),
    });
