import { __dev__, logger } from 'src/helpers/logger';
import { isNonEmptyMandalaContent } from 'src/lib/mandala/is-empty-mandala-content';
import { getAllChildren } from 'src/lib/tree-utils/get/get-all-children';
import {
    DocumentState,
    Sections,
} from 'src/stores/document/document-state-type';
import {
    compareSectionIds,
    getParentSection,
} from 'src/engine/mandala-document/section-utils';

const getSlotOfDirectChild = (section: string, parentSection: string) => {
    const parentParts = parentSection.split('.').length;
    const parts = section.split('.');
    if (parts.length !== parentParts + 1) return null;
    if (parts.slice(0, -1).join('.') !== parentSection) return null;
    const slot = Number(parts[parts.length - 1]);
    if (!Number.isInteger(slot) || slot < 1 || slot > 8) return null;
    return slot;
};

const assertSectionBijection = (sections: Sections) => {
    if (!__dev__) return;
    const sectionEntries = Object.entries(sections.section_id);
    const idEntries = Object.entries(sections.id_section);
    if (sectionEntries.length !== idEntries.length) {
        throw new Error(
            `[mandala-document] section bijection mismatch: section_id=${sectionEntries.length}, id_section=${idEntries.length}`,
        );
    }
    for (const [sectionId, nodeId] of sectionEntries) {
        if (sections.id_section[nodeId] !== sectionId) {
            throw new Error(
                `[mandala-document] section bijection broken at section "${sectionId}"`,
            );
        }
    }
};

export const buildSubtreeNonEmptyCountBySection = (
    documentContent: DocumentState['document']['content'],
    sections: Sections,
    orderedSections?: string[],
) => {
    const sortedSections =
        orderedSections?.length && orderedSections.length > 0
            ? [...orderedSections]
            : Object.keys(sections.section_id).sort(compareSectionIds);
    const subtreeNonEmptyCountBySection: Record<string, number> = {};

    for (const sectionId of sortedSections) {
        const nodeId = sections.section_id[sectionId];
        const content = nodeId ? documentContent[nodeId]?.content ?? '' : '';
        subtreeNonEmptyCountBySection[sectionId] = isNonEmptyMandalaContent(
            content,
        )
            ? 1
            : 0;
    }

    for (let i = sortedSections.length - 1; i >= 0; i -= 1) {
        const sectionId = sortedSections[i];
        const parent = getParentSection(sectionId);
        if (!parent) continue;
        subtreeNonEmptyCountBySection[parent] =
            (subtreeNonEmptyCountBySection[parent] ?? 0) +
            (subtreeNonEmptyCountBySection[sectionId] ?? 0);
    }

    return subtreeNonEmptyCountBySection;
};

const buildParentToChildrenSlots = (sectionIds: string[]) => {
    const parentToChildrenSlots: Record<
        string,
        Partial<Record<number, string>>
    > = {};

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
    return parentToChildrenSlots;
};

export const rebuildMandalaV2MetaFromSections = (
    state: DocumentState,
    options: { bumpRevision?: boolean } = {},
) => {
    const bumpRevision = options.bumpRevision ?? true;
    assertSectionBijection(state.sections);
    const orderedSections = Object.keys(state.sections.section_id).sort(
        compareSectionIds,
    );
    const parentToChildrenSlots = buildParentToChildrenSlots(orderedSections);
    const subtreeNonEmptyCountBySection = buildSubtreeNonEmptyCountBySection(
        state.document.content,
        state.sections,
        orderedSections,
    );

    state.meta.mandalaV2 = {
        ...state.meta.mandalaV2,
        revision: bumpRevision
            ? state.meta.mandalaV2.revision + 1
            : state.meta.mandalaV2.revision,
        orderedSections,
        parentToChildrenSlots,
        subtreeNonEmptyCountBySection,
    };
};

type MutateOptions = {
    commit?: boolean;
};

export const registerMandalaSection = (
    state: DocumentState,
    nodeId: string,
    sectionId: string,
    options: MutateOptions = {},
) => {
    state.sections.section_id[sectionId] = nodeId;
    state.sections.id_section[nodeId] = sectionId;
    if (options.commit ?? true) {
        rebuildMandalaV2MetaFromSections(state);
    }
};

export const registerMandalaChildSections = (
    state: DocumentState,
    parentNodeId: string,
    createdNodeIds: string[],
    options: MutateOptions = {},
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

    if (options.commit ?? true) {
        rebuildMandalaV2MetaFromSections(state);
    }
};

export const removeMandalaDescendantSectionsByParents = (
    state: DocumentState,
    parentNodeIds: string[],
    options: MutateOptions = {},
) => {
    if (parentNodeIds.length === 0) return;

    const sectionsToDelete = new Set<string>();
    for (const parentNodeId of parentNodeIds) {
        const descendants = getAllChildren(
            state.document.columns,
            parentNodeId,
        );
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

    if (options.commit ?? true) {
        rebuildMandalaV2MetaFromSections(state);
    }
};

export const removeMandalaSubtreeSectionsByRoots = (
    state: DocumentState,
    rootNodeIds: string[],
    options: MutateOptions = {},
) => {
    if (rootNodeIds.length === 0) return;

    const sectionsToDelete = new Set<string>();
    const nodeIdsToDelete = new Set<string>();
    for (const rootNodeId of rootNodeIds) {
        nodeIdsToDelete.add(rootNodeId);
        const rootSection = state.sections.id_section[rootNodeId];
        if (rootSection) {
            sectionsToDelete.add(rootSection);
        }
        const descendants = getAllChildren(
            state.document.columns,
            rootNodeId,
        );
        for (const nodeId of descendants) {
            nodeIdsToDelete.add(nodeId);
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

    state.pinnedNodes.Ids = state.pinnedNodes.Ids.filter(
        (nodeId) => !nodeIdsToDelete.has(nodeId),
    );

    if (options.commit ?? true) {
        rebuildMandalaV2MetaFromSections(state);
    }
};

export const applyMandalaContentDelta = (
    state: DocumentState,
    nodeId: string,
    previousContent: string,
    nextContent: string,
) => {
    if (!state.meta.mandalaV2.enabled) return;
    const before = isNonEmptyMandalaContent(previousContent) ? 1 : 0;
    const after = isNonEmptyMandalaContent(nextContent) ? 1 : 0;
    const delta = after - before;
    if (delta === 0) return;

    const sectionId = state.sections.id_section[nodeId];
    if (!sectionId) return;

    const counts = state.meta.mandalaV2.subtreeNonEmptyCountBySection;
    let current: string | null = sectionId;
    while (current) {
        const next = (counts[current] ?? 0) + delta;
        counts[current] = next < 0 ? 0 : next;
        current = getParentSection(current);
    }
};

export const logMandalaIndexRepair = (state: DocumentState, reason: string) => {
    logger.warn('[mandala-document] rebuild slot authority indexes', {
        reason,
        sections: Object.keys(state.sections.section_id).length,
    });
    rebuildMandalaV2MetaFromSections(state);
};
