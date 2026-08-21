import { createStableNodeId } from 'src/mandala-document/engine/build-state';
import { parseSectionParts } from 'src/mandala-document/engine/section-utils';
import {
    normalizeSectionContent,
    SECTION_MARKER_RE,
} from 'src/mandala-document/engine/parse-sections';
import { validateSectionsStructure } from 'src/mandala-document/engine/validate-structure';
import type { MandalaSectionValidationError } from 'src/mandala-document/engine/types';

export type MandalaChildSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type SectionRange = {
    id: string;
    markerStart: number;
    markerEnd: number;
    contentStart: number;
    contentEnd: number;
    sectionEnd: number;
    depth: number;
    parentId: string | null;
    slot: MandalaChildSlot | null;
};

export type SectionIndexDiagnostics = {
    valid: boolean;
    errors: MandalaSectionValidationError[];
};

export type SectionIndex = {
    byId: Map<string, SectionRange>;
    sourceOrderedIds: string[];
    canonicalOrderedIds: string[];
    rootIds: string[];
    childrenSlotsByParent: Map<
        string,
        Partial<Record<MandalaChildSlot, string>>
    >;
    sectionToNodeId: Map<string, string>;
    nodeIdToSection: Map<string, string>;
    sourceRevision: number;
    sourceBytes: number;
    diagnostics: SectionIndexDiagnostics;
    metrics: {
        indexMs: number;
    };
};

const encoder = new TextEncoder();

const compareSectionParts = (left: number[], right: number[]) => {
    const max = Math.max(left.length, right.length);
    for (let index = 0; index < max; index += 1) {
        const leftPart = left[index];
        const rightPart = right[index];
        if (leftPart === undefined) return -1;
        if (rightPart === undefined) return 1;
        if (leftPart !== rightPart) return leftPart - rightPart;
    }
    return 0;
};

const readContentBounds = (
    source: string,
    markerEnd: number,
    sectionEnd: number,
) => {
    const raw = source.slice(markerEnd, sectionEnd);
    let contentStart = markerEnd;
    let contentEnd = sectionEnd;

    if (raw.startsWith('\r\n')) {
        contentStart += 2;
    } else if (raw.startsWith('\n')) {
        contentStart += 1;
    }

    if (raw.endsWith('\r\n')) {
        contentEnd -= 2;
    } else if (raw.endsWith('\n')) {
        contentEnd -= 1;
    }

    return { contentStart, contentEnd };
};

const toChildSlot = (parts: number[]): MandalaChildSlot | null => {
    const value = parts.length > 1 ? parts[parts.length - 1] : null;
    return value && value >= 1 && value <= 8
        ? (value as MandalaChildSlot)
        : null;
};

const buildNodeMaps = (canonicalOrderedIds: string[]) => {
    const sectionToNodeId = new Map<string, string>();
    const nodeIdToSection = new Map<string, string>();
    const usedNodeIds = new Set<string>();

    for (const sectionId of canonicalOrderedIds) {
        const nodeId = createStableNodeId(sectionId, usedNodeIds);
        sectionToNodeId.set(sectionId, nodeId);
        nodeIdToSection.set(nodeId, sectionId);
    }

    return { sectionToNodeId, nodeIdToSection };
};

export const buildSectionIndex = (
    source: string,
    options: { sourceRevision?: number } = {},
): SectionIndex => {
    const startedAt = performance.now();
    const sourceOrderedIds: string[] = [];
    const ranges: SectionRange[] = [];
    const partsById = new Map<string, number[]>();
    const markerRegex = new RegExp(SECTION_MARKER_RE.source, 'g');

    for (const match of source.matchAll(markerRegex)) {
        const id = match[1]?.trim();
        const marker = match[0];
        const markerStart = match.index ?? -1;
        if (!id || !marker || markerStart < 0) continue;

        const parts = parseSectionParts(id);
        partsById.set(id, parts);
        const markerEnd = markerStart + marker.length;
        sourceOrderedIds.push(id);
        ranges.push({
            id,
            markerStart,
            markerEnd,
            contentStart: markerEnd,
            contentEnd: source.length,
            sectionEnd: source.length,
            depth: parts.length,
            parentId: parts.length > 1 ? parts.slice(0, -1).join('.') : null,
            slot: toChildSlot(parts),
        });
    }

    for (let i = 0; i < ranges.length; i += 1) {
        const range = ranges[i];
        const sectionEnd = ranges[i + 1]?.markerStart ?? source.length;
        const contentBounds = readContentBounds(
            source,
            range.markerEnd,
            sectionEnd,
        );
        range.sectionEnd = sectionEnd;
        range.contentStart = contentBounds.contentStart;
        range.contentEnd = contentBounds.contentEnd;
    }

    const canonicalOrderedIds = Array.from(new Set(sourceOrderedIds)).sort(
        (left, right) =>
            compareSectionParts(
                partsById.get(left) ?? [],
                partsById.get(right) ?? [],
            ),
    );
    const errors = validateSectionsStructure(
        ranges.map((range) => ({
            id: range.id,
            content: '',
            markerStart: range.markerStart,
            markerEnd: range.markerEnd,
        })),
    );
    const byId = new Map<string, SectionRange>();
    for (const range of ranges) {
        if (!byId.has(range.id)) byId.set(range.id, range);
    }

    const childrenSlotsByParent = new Map<
        string,
        Partial<Record<MandalaChildSlot, string>>
    >();
    for (const range of ranges) {
        if (!range.parentId || !range.slot) continue;
        const slots = childrenSlotsByParent.get(range.parentId) ?? {};
        slots[range.slot] = range.id;
        childrenSlotsByParent.set(range.parentId, slots);
    }

    const { sectionToNodeId, nodeIdToSection } =
        buildNodeMaps(canonicalOrderedIds);
    const rootIds = canonicalOrderedIds.filter(
        (sectionId) => byId.get(sectionId)?.depth === 1,
    );

    return {
        byId,
        sourceOrderedIds,
        canonicalOrderedIds,
        rootIds,
        childrenSlotsByParent,
        sectionToNodeId,
        nodeIdToSection,
        sourceRevision: options.sourceRevision ?? 0,
        sourceBytes: encoder.encode(source).length,
        diagnostics: {
            valid: errors.length === 0 && ranges.length > 0,
            errors,
        },
        metrics: {
            indexMs: Number((performance.now() - startedAt).toFixed(2)),
        },
    };
};

export const getSectionContent = (
    source: string,
    range: SectionRange | undefined,
) =>
    range
        ? normalizeSectionContent(
              source.slice(range.markerEnd, range.sectionEnd),
          )
        : null;

export const getSectionContentFromRange = (
    source: string,
    range: SectionRange | undefined,
) => (range ? source.slice(range.contentStart, range.contentEnd) : null);
