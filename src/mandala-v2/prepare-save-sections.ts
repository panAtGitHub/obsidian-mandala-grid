import { MandalaSectionId } from 'src/mandala-v2/types';
import {
    MandalaGridDocument,
    Sections,
} from 'src/stores/document/document-state-type';

type SerializableSection = {
    sectionId: MandalaSectionId;
    content: string;
};

type PrepareSaveSectionsResult = {
    sections: SerializableSection[];
    blockedReasons: string[];
    stats: {
        droppedSectionCount: number;
        prunedParentCount: number;
        blockedParentCount: number;
    };
};

const getParentSection = (sectionId: string) => {
    const lastDot = sectionId.lastIndexOf('.');
    if (lastDot < 0) return null;
    return sectionId.slice(0, lastDot);
};

const parseLastPart = (sectionId: string) => {
    const part = sectionId.split('.').pop();
    const value = Number(part);
    return Number.isInteger(value) ? value : null;
};

const getDepth = (sectionId: string) => sectionId.split('.').length;

const isTextEmpty = (value: string) => value.length === 0;

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

const collectDescendants = (
    sectionIds: string[],
    sectionId: string,
): string[] => {
    const prefix = `${sectionId}.`;
    return sectionIds.filter((id) => id.startsWith(prefix));
};

export const prepareSaveSections = (
    document: Pick<MandalaGridDocument, 'content'>,
    sections: Sections,
): PrepareSaveSectionsResult => {
    const sectionIds = Object.keys(sections.section_id).sort(compareSectionIds);
    const directChildren = new Map<string, Set<string>>();

    for (const sectionId of sectionIds) {
        const parent = getParentSection(sectionId);
        if (!parent) continue;
        const set = directChildren.get(parent) ?? new Set<string>();
        set.add(sectionId);
        directChildren.set(parent, set);
    }

    const blockedReasons: string[] = [];
    const prunableParents: string[] = [];

    for (const [parent, childrenSet] of directChildren) {
        const children = Array.from(childrenSet);
        const parentDepth = getDepth(parent);
        const slots = new Map<number, string>();
        for (const child of children) {
            if (getDepth(child) !== parentDepth + 1) continue;
            const slot = parseLastPart(child);
            if (!slot || slot < 1 || slot > 8) continue;
            slots.set(slot, child);
        }

        if (slots.size !== 8) continue;
        const orderedChildren = Array.from({ length: 8 }, (_, index) =>
            slots.get(index + 1),
        );
        if (orderedChildren.some((item) => !item)) continue;
        const childIds = orderedChildren as string[];
        const allDirectChildrenEmpty = childIds.every((childId) => {
            const nodeId = sections.section_id[childId];
            const content = nodeId ? document.content[nodeId]?.content ?? '' : '';
            return isTextEmpty(content);
        });
        if (!allDirectChildrenEmpty) continue;

        const hasNonEmptyDescendant = childIds.some((childId) =>
            collectDescendants(sectionIds, childId).some((descendantId) => {
                const descendantNodeId = sections.section_id[descendantId];
                const content = descendantNodeId
                    ? document.content[descendantNodeId]?.content ?? ''
                    : '';
                return !isTextEmpty(content);
            }),
        );

        if (hasNonEmptyDescendant) {
            blockedReasons.push(
                `Save blocked: section "${parent}" has empty direct slots but non-empty deeper descendants.`,
            );
            continue;
        }

        prunableParents.push(parent);
    }

    if (blockedReasons.length > 0) {
        return {
            sections: sectionIds.map((sectionId) => {
                const nodeId = sections.section_id[sectionId];
                return {
                    sectionId,
                    content: nodeId ? document.content[nodeId]?.content ?? '' : '',
                };
            }),
            blockedReasons,
            stats: {
                droppedSectionCount: 0,
                prunedParentCount: 0,
                blockedParentCount: blockedReasons.length,
            },
        };
    }

    const sortedPrunableParents = [...prunableParents].sort(compareSectionIds);
    const selectedParents: string[] = [];
    const selectedParentSet = new Set<string>();
    for (const parent of sortedPrunableParents) {
        let ancestor = getParentSection(parent);
        let underSelectedParent = false;
        while (ancestor) {
            if (selectedParentSet.has(ancestor)) {
                underSelectedParent = true;
                break;
            }
            ancestor = getParentSection(ancestor);
        }
        if (underSelectedParent) continue;
        selectedParents.push(parent);
        selectedParentSet.add(parent);
    }

    const droppedSections = new Set<string>();
    for (const parent of selectedParents) {
        for (const descendant of collectDescendants(sectionIds, parent)) {
            droppedSections.add(descendant);
        }
    }

    const serializableSections = sectionIds
        .filter((sectionId) => !droppedSections.has(sectionId))
        .map((sectionId) => {
            const nodeId = sections.section_id[sectionId];
            return {
                sectionId,
                content: nodeId ? document.content[nodeId]?.content ?? '' : '',
            };
        });

    return {
        sections: serializableSections,
        blockedReasons: [],
        stats: {
            droppedSectionCount: droppedSections.size,
            prunedParentCount: selectedParents.length,
            blockedParentCount: 0,
        },
    };
};
