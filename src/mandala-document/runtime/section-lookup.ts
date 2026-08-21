import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import type { SectionIndex } from 'src/mandala-document/runtime/section-index';

export type SectionLookup = {
    has: (sectionId: string) => boolean;
    getNodeId: (sectionId: string) => string | null;
    getSectionId: (nodeId: string) => string | null;
    getRootSections?: () => string[];
    getParent: (sectionId: string) => string | null;
    getDirectChild: (parentSection: string, slot: number) => string | null;
    hasAllDirectSlots: (parentSection: string) => boolean;
    getContent: (sectionId: string) => string | null;
};

export const createSectionLookupFromIndex = (
    index: SectionIndex,
    getContent: (sectionId: string) => string | null,
): SectionLookup => ({
    has: (sectionId) => index.byId.has(sectionId),
    getNodeId: (sectionId) => index.sectionToNodeId.get(sectionId) ?? null,
    getSectionId: (nodeId) => index.nodeIdToSection.get(nodeId) ?? null,
    getRootSections: () => index.rootIds,
    getParent: (sectionId) => index.byId.get(sectionId)?.parentId ?? null,
    getDirectChild: (parentSection, slot) => {
        const children = index.childrenSlotsByParent.get(parentSection);
        return children?.[slot as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8] ?? null;
    },
    hasAllDirectSlots: (parentSection) => {
        const children = index.childrenSlotsByParent.get(parentSection);
        if (!children) return false;
        for (let slot = 1; slot <= 8; slot += 1) {
            if (!children[slot as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8]) {
                return false;
            }
        }
        return true;
    },
    getContent,
});

export const createSectionLookupFromDocumentState = (
    state: Pick<DocumentState, 'sections' | 'document'>,
): SectionLookup => ({
    has: (sectionId) => Boolean(state.sections.section_id[sectionId]),
    getNodeId: (sectionId) => state.sections.section_id[sectionId] ?? null,
    getSectionId: (nodeId) => state.sections.id_section[nodeId] ?? null,
    getRootSections: () =>
        Object.keys(state.sections.section_id).filter(
            (sectionId) => !sectionId.includes('.'),
        ),
    getParent: (sectionId) => {
        const lastDot = sectionId.lastIndexOf('.');
        return lastDot < 0 ? null : sectionId.slice(0, lastDot);
    },
    getDirectChild: (parentSection, slot) =>
        state.sections.section_id[`${parentSection}.${slot}`] ?? null,
    hasAllDirectSlots: (parentSection) => {
        for (let slot = 1; slot <= 8; slot += 1) {
            if (!state.sections.section_id[`${parentSection}.${slot}`]) {
                return false;
            }
        }
        return true;
    },
    getContent: (sectionId) => {
        const nodeId = state.sections.section_id[sectionId];
        return nodeId ? state.document.content[nodeId]?.content ?? '' : null;
    },
});
