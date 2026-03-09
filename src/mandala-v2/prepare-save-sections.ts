import { isEmptyMandalaContent } from 'src/lib/mandala/is-empty-mandala-content';
import { MandalaSectionId } from 'src/mandala-v2/types';
import {
    MandalaGridDocument,
    Sections,
} from 'src/stores/document/document-state-type';
import { buildSubtreeNonEmptyCountBySection } from 'src/stores/document/reducers/mandala/mandala-slot-authority';
import {
    compareSectionIds,
    getParentSection,
} from 'src/mandala-v2/section-utils';

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

type PrepareSaveSectionsOptions = {
    parentToChildrenSlots?: Record<string, Partial<Record<number, string>>>;
    subtreeNonEmptyCountBySection?: Record<string, number>;
};

const createParentToChildrenSlots = (sectionIds: string[]) => {
    const slotsByParent: Record<string, Partial<Record<number, string>>> = {};
    for (const sectionId of sectionIds) {
        const parent = getParentSection(sectionId);
        if (!parent) continue;
        const slot = Number(sectionId.slice(sectionId.lastIndexOf('.') + 1));
        if (!Number.isInteger(slot) || slot < 1 || slot > 8) continue;
        if (!slotsByParent[parent]) {
            slotsByParent[parent] = {};
        }
        slotsByParent[parent][slot] = sectionId;
    }
    return slotsByParent;
};

const createChildrenByParent = (sectionIds: string[]) => {
    const childrenByParent = new Map<string, string[]>();
    for (const sectionId of sectionIds) {
        const parent = getParentSection(sectionId);
        if (!parent) continue;
        const list = childrenByParent.get(parent) ?? [];
        list.push(sectionId);
        childrenByParent.set(parent, list);
    }
    return childrenByParent;
};

const walkDescendants = (
    root: string,
    childrenByParent: Map<string, string[]>,
    visit: (sectionId: string) => void,
) => {
    const stack = [...(childrenByParent.get(root) ?? [])];
    while (stack.length > 0) {
        const sectionId = stack.pop()!;
        visit(sectionId);
        const children = childrenByParent.get(sectionId);
        if (!children || children.length === 0) continue;
        for (let i = 0; i < children.length; i += 1) {
            stack.push(children[i]);
        }
    }
};

export const prepareSaveSections = (
    document: Pick<MandalaGridDocument, 'content'>,
    sections: Sections,
    options: PrepareSaveSectionsOptions = {},
): PrepareSaveSectionsResult => {
    const sectionIds = Object.keys(sections.section_id).sort(compareSectionIds);
    const parentToChildrenSlots =
        options.parentToChildrenSlots ??
        createParentToChildrenSlots(sectionIds);
    const subtreeNonEmptyCountBySection =
        options.subtreeNonEmptyCountBySection ??
        buildSubtreeNonEmptyCountBySection(
            document.content,
            sections,
            sectionIds,
        );

    const blockedReasons: string[] = [];
    const prunableParents: string[] = [];

    for (const [parent, slots] of Object.entries(parentToChildrenSlots)) {
        const childSections: string[] = [];
        let hasAllSlots = true;
        for (let i = 1; i <= 8; i += 1) {
            const sectionId = slots[i];
            if (!sectionId) {
                hasAllSlots = false;
                break;
            }
            childSections.push(sectionId);
        }
        if (!hasAllSlots) continue;

        let allDirectChildrenEmpty = true;
        for (const childSection of childSections) {
            const nodeId = sections.section_id[childSection];
            const content = nodeId
                ? document.content[nodeId]?.content ?? ''
                : '';
            if (!isEmptyMandalaContent(content)) {
                allDirectChildrenEmpty = false;
                break;
            }
        }
        if (!allDirectChildrenEmpty) continue;

        const hasNonEmptyDescendant = childSections.some(
            (childSection) =>
                (subtreeNonEmptyCountBySection[childSection] ?? 0) > 0,
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
                    content: nodeId
                        ? document.content[nodeId]?.content ?? ''
                        : '',
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

    const childrenByParent = createChildrenByParent(sectionIds);
    const droppedSections = new Set<string>();
    for (const parent of selectedParents) {
        walkDescendants(parent, childrenByParent, (sectionId) => {
            droppedSections.add(sectionId);
        });
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
