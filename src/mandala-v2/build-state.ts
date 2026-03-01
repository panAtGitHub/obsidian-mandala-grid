import {
    BuildMandalaDocumentV2Props,
    MandalaDocumentV2,
    MandalaSectionId,
    ParsedMandalaSection,
} from 'src/mandala-v2/types';
import { id } from 'src/helpers/id';
import {
    compareSectionIds,
    parseSectionParts,
} from 'src/mandala-v2/section-utils';

type ParsedSectionParts = {
    id: MandalaSectionId;
    content: string;
    parts: number[];
};

const toHash32 = (input: string) => {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash +=
            (hash << 1) +
            (hash << 4) +
            (hash << 7) +
            (hash << 8) +
            (hash << 24);
    }
    return hash >>> 0;
};

export const createStableNodeId = (sectionId: string, usedIds: Set<string>) => {
    let salt = 0;
    while (salt < 1000) {
        const seed = salt === 0 ? sectionId : `${sectionId}#${salt}`;
        const hash = toHash32(seed).toString(36).padStart(8, '0').slice(0, 8);
        const candidate = `n${hash}`;
        if (!usedIds.has(candidate)) {
            usedIds.add(candidate);
            return candidate;
        }
        salt += 1;
    }
    return id.node();
};

const toParsedParts = (
    sections: ParsedMandalaSection[],
): ParsedSectionParts[] => {
    return sections
        .map((section) => ({
            id: section.id,
            content: section.content,
            parts: parseSectionParts(section.id),
        }))
        .sort((a, b) => compareSectionIds(a.id, b.id));
};

const toParentSection = (
    section: ParsedSectionParts,
): MandalaSectionId | null => {
    if (section.parts.length <= 1) return null;
    return section.parts.slice(0, -1).join('.');
};

const createColumnId = (index: number) => {
    const encoded = (index + 1).toString(36).padStart(8, '0');
    return `c${encoded}`;
};

export const MANDALA_ROOT_GROUP_ID = 'r00000000';

export const buildMandalaColumnsFromSections = (
    orderedSections: string[],
    sectionToNode: Record<string, string>,
    rootGroupId = MANDALA_ROOT_GROUP_ID,
) => {
    const maxDepth = orderedSections.reduce(
        (acc, sectionId) => Math.max(acc, parseSectionParts(sectionId).length),
        1,
    );
    const columns = Array.from({ length: maxDepth }, (_, index) => ({
        id: createColumnId(index),
        groups: [] as { parentId: string; nodes: string[] }[],
    }));
    const groupMaps = columns.map(
        () => new Map<string, { parentId: string; nodes: string[] }>(),
    );

    for (const sectionId of orderedSections) {
        const parts = parseSectionParts(sectionId);
        const depthIndex = parts.length - 1;
        const parentSection =
            parts.length <= 1 ? null : parts.slice(0, -1).join('.');
        const parentNodeId = parentSection
            ? sectionToNode[parentSection]
            : rootGroupId;
        const currentColumnGroups = groupMaps[depthIndex];
        let group = currentColumnGroups.get(parentNodeId);
        if (!group) {
            group = {
                parentId: parentNodeId,
                nodes: [],
            };
            currentColumnGroups.set(parentNodeId, group);
        }
        group.nodes.push(sectionToNode[sectionId]);
    }

    for (let i = 0; i < columns.length; i += 1) {
        columns[i].groups = Array.from(groupMaps[i].values());
    }

    return columns;
};

export const buildMandalaDocumentV2 = (
    props: BuildMandalaDocumentV2Props,
): MandalaDocumentV2 => {
    const parsed = toParsedParts(props.sections);
    const content: MandalaDocumentV2['content'] = {};
    const contentBySection: MandalaDocumentV2['contentBySection'] = {};
    const sectionToNode: Record<string, string> = {};
    const nodeToSection: Record<string, string> = {};
    const parentToChildrenSlots: Record<
        string,
        Partial<Record<number, MandalaSectionId>>
    > = {};
    const orderedSections = parsed.map((section) => section.id);
    const usedNodeIds = new Set<string>();

    for (const section of parsed) {
        const nodeId = createStableNodeId(section.id, usedNodeIds);
        sectionToNode[section.id] = nodeId;
        nodeToSection[nodeId] = section.id;
    }

    for (const section of parsed) {
        const nodeId = sectionToNode[section.id];
        const parentSection = toParentSection(section);
        content[nodeId] = {
            content: section.content,
        };
        contentBySection[section.id] = section.content;

        if (parentSection) {
            if (!parentToChildrenSlots[parentSection]) {
                parentToChildrenSlots[parentSection] = {};
            }
            const slot = section.parts[section.parts.length - 1];
            parentToChildrenSlots[parentSection][slot] = section.id;
        }
    }

    const rootGroupId = MANDALA_ROOT_GROUP_ID;
    const columns = buildMandalaColumnsFromSections(
        orderedSections,
        sectionToNode,
        rootGroupId,
    );

    return {
        columns,
        content,
        contentBySection,
        sectionToNode,
        nodeToSection,
        parentToChildrenSlots,
        orderedSections,
        rootGroupId,
    };
};
