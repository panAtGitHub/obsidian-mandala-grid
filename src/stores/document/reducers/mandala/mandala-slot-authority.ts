import { getAllChildren } from 'src/lib/tree-utils/get/get-all-children';
import { DocumentState } from 'src/stores/document/document-state-type';

const compareSectionIds = (a: string, b: string) => {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    const max = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < max; i += 1) {
        const av = aParts[i];
        const bv = bParts[i];
        if (av === undefined) return -1;
        if (bv === undefined) return 1;
        if (av !== bv) return av - bv;
    }
    return 0;
};

const getParentSection = (section: string) => {
    const lastDot = section.lastIndexOf('.');
    if (lastDot === -1) return null;
    return section.slice(0, lastDot);
};

const getSlotOfDirectChild = (section: string, parentSection: string) => {
    const parentParts = parentSection.split('.').length;
    const parts = section.split('.');
    if (parts.length !== parentParts + 1) return null;
    if (parts.slice(0, -1).join('.') !== parentSection) return null;
    const slot = Number(parts[parts.length - 1]);
    if (!Number.isInteger(slot) || slot < 1 || slot > 8) return null;
    return slot;
};

const rebuildMandalaV2MetaFromSections = (state: DocumentState) => {
    const sectionIds = Object.keys(state.sections.section_id).sort(compareSectionIds);
    const parentToChildrenSlots: Record<string, Partial<Record<number, string>>> =
        {};

    for (const sectionId of sectionIds) {
        const parent = getParentSection(sectionId);
        if (!parent) continue;
        const slot = getSlotOfDirectChild(sectionId, parent);
        if (!slot) continue;
        if (!parentToChildrenSlots[parent]) {
            parentToChildrenSlots[parent] = {};
        }
        parentToChildrenSlots[parent][slot] = sectionId;
    }

    state.meta.mandalaV2 = {
        ...state.meta.mandalaV2,
        revision: state.meta.mandalaV2.revision + 1,
        orderedSections: sectionIds,
        parentToChildrenSlots,
    };
};

export const registerMandalaSection = (
    state: DocumentState,
    nodeId: string,
    sectionId: string,
) => {
    state.sections.section_id[sectionId] = nodeId;
    state.sections.id_section[nodeId] = sectionId;
    rebuildMandalaV2MetaFromSections(state);
};

export const registerMandalaChildSections = (
    state: DocumentState,
    parentNodeId: string,
    createdNodeIds: string[],
) => {
    if (createdNodeIds.length === 0) return;
    const parentSection = state.sections.id_section[parentNodeId];
    if (!parentSection) return;

    const usedSlots = new Set<number>();
    const parentDepth = parentSection.split('.').length;
    for (const sectionId of Object.keys(state.sections.section_id)) {
        const parts = sectionId.split('.');
        if (parts.length !== parentDepth + 1) continue;
        if (parts.slice(0, -1).join('.') !== parentSection) continue;
        const slot = Number(parts[parts.length - 1]);
        if (!Number.isInteger(slot)) continue;
        usedSlots.add(slot);
    }

    let slotCursor = 1;
    for (const nodeId of createdNodeIds) {
        while (slotCursor <= 8 && usedSlots.has(slotCursor)) {
            slotCursor += 1;
        }
        if (slotCursor > 8) break;
        const sectionId = `${parentSection}.${slotCursor}`;
        state.sections.section_id[sectionId] = nodeId;
        state.sections.id_section[nodeId] = sectionId;
        usedSlots.add(slotCursor);
        slotCursor += 1;
    }

    rebuildMandalaV2MetaFromSections(state);
};

export const removeMandalaDescendantSectionsByParents = (
    state: DocumentState,
    parentNodeIds: string[],
) => {
    if (parentNodeIds.length === 0) return;

    const sectionsToDelete = new Set<string>();
    for (const parentNodeId of parentNodeIds) {
        const descendants = getAllChildren(state.document.columns, parentNodeId);
        for (const nodeId of descendants) {
            const sectionId = state.sections.id_section[nodeId];
            if (sectionId) {
                sectionsToDelete.add(sectionId);
            }
        }
    }

    for (const sectionId of sectionsToDelete) {
        const nodeId = state.sections.section_id[sectionId];
        if (nodeId) {
            delete state.sections.id_section[nodeId];
        }
        delete state.sections.section_id[sectionId];
    }

    rebuildMandalaV2MetaFromSections(state);
};
