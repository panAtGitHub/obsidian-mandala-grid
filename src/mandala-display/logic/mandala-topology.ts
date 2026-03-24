import {
    compareSectionIds,
    getParentSection,
    parseSectionParts,
} from 'src/mandala-document/engine/section-utils';

export type MandalaTopologyEntry = {
    section: string;
    nodeId: string | null;
    parts: number[];
    depth: number;
    parentSection: string | null;
    coreSection: string;
    slot: number | null;
};

export type MandalaTopologyIndex = {
    entries: Record<string, MandalaTopologyEntry>;
    orderedSections: string[];
    sectionsWithNode: string[];
    coreSections: string[];
    sectionByNodeId: Record<string, string>;
    childrenBySection: Record<string, string[]>;
};

const toSectionEntry = (
    section: string,
    nodeId: string | undefined,
): MandalaTopologyEntry => {
    const parts = parseSectionParts(section);
    return {
        section,
        nodeId: nodeId ?? null,
        parts,
        depth: parts.length,
        parentSection: getParentSection(section),
        coreSection: String(parts[0] ?? ''),
        slot: parts.length >= 2 ? parts[1] ?? null : null,
    };
};

export const buildMandalaTopologyIndex = (
    sectionIdMap: Record<string, string | undefined>,
): MandalaTopologyIndex => {
    const orderedSections = Object.keys(sectionIdMap).sort(compareSectionIds);
    const entries: Record<string, MandalaTopologyEntry> = {};
    const sectionsWithNode: string[] = [];
    const coreSections: string[] = [];
    const sectionByNodeId: Record<string, string> = {};
    const childrenBySection: Record<string, string[]> = {};

    for (const section of orderedSections) {
        const entry = toSectionEntry(section, sectionIdMap[section]);
        entries[section] = entry;
        if (entry.nodeId) {
            sectionsWithNode.push(section);
            sectionByNodeId[entry.nodeId] = section;
            if (entry.depth === 1) {
                coreSections.push(section);
            }
        }
        if (entry.parentSection) {
            (childrenBySection[entry.parentSection] ??= []).push(section);
        }
    }

    return {
        entries,
        orderedSections,
        sectionsWithNode,
        coreSections,
        sectionByNodeId,
        childrenBySection,
    };
};

export const getTopologyEntry = (
    topology: MandalaTopologyIndex,
    section: string | null | undefined,
) => (section ? topology.entries[section] ?? null : null);

export const getSectionNodeId = (
    topology: MandalaTopologyIndex,
    section: string | null | undefined,
) => getTopologyEntry(topology, section)?.nodeId ?? null;

export const getSectionCore = (section: string | null | undefined) => {
    if (!section) return null;
    const parts = parseSectionParts(section);
    return parts.length ? String(parts[0]) : null;
};
