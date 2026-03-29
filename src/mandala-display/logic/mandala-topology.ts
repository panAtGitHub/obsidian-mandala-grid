import {
    compareSectionIds,
    getParentSection,
    parseSectionParts,
} from 'src/mandala-document/engine/section-utils';
import {
    createBoundedCache,
    createObjectIdentityKeyResolver,
} from 'src/shared/helpers/bounded-cache';

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

const TOPOLOGY_CACHE_LIMIT = 8;
const topologyCache = createBoundedCache<MandalaTopologyIndex>({
    capacity: TOPOLOGY_CACHE_LIMIT,
});
const resolveSectionIdMapKey = createObjectIdentityKeyResolver({
    label: 'section-id-map',
});

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
    const cacheKey = resolveSectionIdMapKey(sectionIdMap);
    const cached = topologyCache.get(cacheKey);
    if (cached) {
        return cached;
    }

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

    const topology = {
        entries,
        orderedSections,
        sectionsWithNode,
        coreSections,
        sectionByNodeId,
        childrenBySection,
    };
    return topologyCache.set(cacheKey, topology);
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
