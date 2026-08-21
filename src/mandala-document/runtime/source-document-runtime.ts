import {
    buildMandalaColumnsFromSections,
    MANDALA_ROOT_GROUP_ID,
} from 'src/mandala-document/engine/build-state';
import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import {
    buildSectionIndex,
    getSectionContentFromRange,
    type SectionIndex,
    type SectionRange,
} from 'src/mandala-document/runtime/section-index';
import type { SectionLookup } from 'src/mandala-document/runtime/section-lookup';
import {
    materializeThreeByThreeWorkingSet,
    materializeWorkingSet,
    type WorkingSet,
} from 'src/mandala-document/runtime/working-set';
import { isNonEmptyMandalaContent } from 'src/mandala-display/logic/is-empty-mandala-content';
import {
    compareSectionIds,
    getParentSection,
} from 'src/mandala-document/engine/section-utils';
import { refreshGroupParentIds } from 'src/mandala-document/state/reducers/meta/refresh-group-parent-ids';

export type SourceContentPatch = {
    sectionId: string;
    content: string;
};

export type SourceMutationResult = {
    source: string;
    index: SectionIndex;
    revision: number;
    changedSections: string[];
    bytesDelta: number;
};

export class StaleSourceRevisionError extends Error {
    constructor(
        public readonly expectedRevision: number,
        public readonly actualRevision: number,
    ) {
        super(
            `Stale Mandala source revision: expected ${expectedRevision}, actual ${actualRevision}`,
        );
        this.name = 'StaleSourceRevisionError';
    }
}

const resolveLineEnding = (source: string, range: SectionRange) => {
    const beforeContent = source.slice(range.markerEnd, range.contentStart);
    if (beforeContent) return beforeContent;
    const afterContent = source.slice(range.contentEnd, range.sectionEnd);
    if (afterContent) return afterContent;
    return '\n';
};

const patchSectionRange = (
    source: string,
    range: SectionRange,
    replacement: string,
) => {
    const lineEnding = resolveLineEnding(source, range);
    const hasNextMarker = range.sectionEnd < source.length;
    const prefix = source.slice(0, range.markerEnd);
    const suffix = source.slice(range.sectionEnd);

    if (!hasNextMarker) {
        return replacement.length > 0
            ? `${prefix}${lineEnding}${replacement}${suffix}`
            : `${prefix}${suffix}`;
    }

    if (replacement.length === 0) {
        return `${prefix}${lineEnding}${suffix}`;
    }

    return `${prefix}${lineEnding}${replacement}${lineEnding}${suffix}`;
};

const resolveSourceLineEnding = (source: string) =>
    source.includes('\r\n') ? '\r\n' : '\n';

const isSectionInSubtree = (sectionId: string, rootSection: string) =>
    sectionId === rootSection || sectionId.startsWith(`${rootSection}.`);

const resolveSubtreeEnd = (
    index: SectionIndex,
    rootSection: string,
    sourceLength: number,
) => {
    const rootPosition = index.sourceOrderedIds.indexOf(rootSection);
    if (rootPosition < 0) return sourceLength;
    for (
        let position = rootPosition + 1;
        position < index.sourceOrderedIds.length;
        position += 1
    ) {
        const candidate = index.sourceOrderedIds[position];
        if (!isSectionInSubtree(candidate, rootSection)) {
            return index.byId.get(candidate)?.markerStart ?? sourceLength;
        }
    }
    return sourceLength;
};

type SourceOperation = {
    start: number;
    end: number;
    replacement: string;
    order: number;
};

const buildInsertedSectionBlock = (
    source: string,
    position: number,
    sectionIds: string[],
    contentBySection: Map<string, string>,
    hasSeparatorBefore: boolean,
) => {
    const lineEnding = resolveSourceLineEnding(source);
    const blocks = sectionIds.map((sectionId) => {
        const content = contentBySection.get(sectionId) ?? '';
        return content.length > 0
            ? `<!--section: ${sectionId}-->${lineEnding}${content}`
            : `<!--section: ${sectionId}-->`;
    });
    const prefix = position > 0 && !hasSeparatorBefore ? lineEnding : '';
    const suffix = position < source.length ? lineEnding : '';
    return `${prefix}${blocks.join(lineEnding)}${suffix}`;
};

const buildWorkingSetSubtreeCounts = (workingSet: WorkingSet) => {
    const counts: Record<string, number> = {};
    const ids = [...workingSet.materializedSectionIds].sort(compareSectionIds);
    for (const sectionId of ids) {
        const content = workingSet.sections.get(sectionId)?.content ?? '';
        counts[sectionId] = isNonEmptyMandalaContent(content) ? 1 : 0;
    }
    for (let index = ids.length - 1; index >= 0; index -= 1) {
        const sectionId = ids[index];
        const parent = getParentSection(sectionId);
        if (parent && counts[parent] !== undefined) {
            counts[parent] += counts[sectionId] ?? 0;
        }
    }
    return counts;
};

export const projectWorkingSetDocumentState = (
    state: DocumentState,
    runtime: MandalaSourceRuntime,
    workingSet: WorkingSet,
    frontmatter = state.file.frontmatter,
): DocumentState => {
    const materializedSectionIds = [...workingSet.materializedSectionIds].sort(
        compareSectionIds,
    );
    const section_id: Record<string, string> = {};
    const id_section: Record<string, string> = {};
    const content: DocumentState['document']['content'] = {};

    for (const sectionId of materializedSectionIds) {
        const section = workingSet.sections.get(sectionId);
        if (!section) continue;
        section_id[sectionId] = section.nodeId;
        id_section[section.nodeId] = sectionId;
        content[section.nodeId] = { content: section.content };
    }

    const columns = buildMandalaColumnsFromSections(
        materializedSectionIds,
        section_id,
        MANDALA_ROOT_GROUP_ID,
    );
    const parentToChildrenSlots: Record<
        string,
        Partial<Record<number, string>>
    > = {};
    for (const sectionId of materializedSectionIds) {
        const parent = getParentSection(sectionId);
        if (!parent) continue;
        const slot = Number(sectionId.slice(sectionId.lastIndexOf('.') + 1));
        if (!parentToChildrenSlots[parent]) parentToChildrenSlots[parent] = {};
        parentToChildrenSlots[parent][slot] = sectionId;
    }

    const nextState: DocumentState = {
        ...state,
        document: { columns, content },
        sections: { section_id, id_section },
        file: { ...state.file, frontmatter },
        meta: {
            ...state.meta,
            groupParentIds: new Set<string>(),
            isMandala: true,
            mandalaV2: {
                ...state.meta.mandalaV2,
                enabled: true,
                revision: state.meta.mandalaV2.revision + 1,
                contentRevision: state.meta.mandalaV2.contentRevision + 1,
                rootGroupId: MANDALA_ROOT_GROUP_ID,
                orderedSections: materializedSectionIds,
                lastMutation: null,
                parentToChildrenSlots,
                subtreeNonEmptyCountBySection:
                    buildWorkingSetSubtreeCounts(workingSet),
                loadMetrics: {
                    bytes: runtime.index.sourceBytes,
                    sectionsCount: runtime.index.canonicalOrderedIds.length,
                    parseMs: runtime.index.metrics.indexMs,
                    buildMs: 0,
                },
            },
        },
    };
    refreshGroupParentIds(nextState.document.columns, nextState.meta);
    return nextState;
};

export class MandalaSourceRuntime implements SectionLookup {
    private currentSource: string;
    private currentIndex: SectionIndex;
    private currentRevision: number;

    constructor(source: string, sourceRevision = 0) {
        this.currentSource = source;
        this.currentRevision = sourceRevision;
        this.currentIndex = buildSectionIndex(source, {
            sourceRevision,
        });
    }

    get source() {
        return this.currentSource;
    }

    get index() {
        return this.currentIndex;
    }

    get revision() {
        return this.currentRevision;
    }

    get lookup(): SectionLookup {
        return this;
    }

    getRange(sectionId: string) {
        return this.currentIndex.byId.get(sectionId) ?? null;
    }

    getContent(sectionId: string) {
        return getSectionContentFromRange(
            this.currentSource,
            this.currentIndex.byId.get(sectionId),
        );
    }

    has(sectionId: string) {
        return this.currentIndex.byId.has(sectionId);
    }

    getNodeId(sectionId: string) {
        return this.currentIndex.sectionToNodeId.get(sectionId) ?? null;
    }

    getSectionId(nodeId: string) {
        return this.currentIndex.nodeIdToSection.get(nodeId) ?? null;
    }

    getRootSections() {
        return this.currentIndex.rootIds;
    }

    getParent(sectionId: string) {
        return this.currentIndex.byId.get(sectionId)?.parentId ?? null;
    }

    getDirectChild(parentSection: string, slot: number) {
        const children =
            this.currentIndex.childrenSlotsByParent.get(parentSection);
        return children?.[slot as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8] ?? null;
    }

    hasAllDirectSlots(parentSection: string) {
        for (let slot = 1; slot <= 8; slot += 1) {
            if (!this.getDirectChild(parentSection, slot)) return false;
        }
        return true;
    }

    materialize(sectionIds: Iterable<string>) {
        return materializeWorkingSet({
            source: this.currentSource,
            index: this.currentIndex,
            sectionIds,
        });
    }

    materializeThreeByThree(centerSection: string) {
        return materializeThreeByThreeWorkingSet({
            source: this.currentSource,
            index: this.currentIndex,
            centerSection,
        });
    }

    replaceSourceFromExternal(source: string) {
        this.currentRevision += 1;
        this.currentSource = source;
        this.currentIndex = buildSectionIndex(source, {
            sourceRevision: this.currentRevision,
        });
        return this.currentIndex;
    }

    replaceSectionContents(
        patches: SourceContentPatch[],
        expectedRevision = this.currentRevision,
    ): SourceMutationResult | null {
        if (expectedRevision !== this.currentRevision) {
            throw new StaleSourceRevisionError(
                expectedRevision,
                this.currentRevision,
            );
        }
        if (!this.currentIndex.diagnostics.valid || patches.length === 0) {
            return null;
        }

        const uniquePatches = new Map<string, string>();
        for (const patch of patches) {
            if (!this.currentIndex.byId.has(patch.sectionId)) return null;
            uniquePatches.set(patch.sectionId, patch.content);
        }

        const ranges = [...uniquePatches.entries()]
            .map(([sectionId, content]) => ({
                sectionId,
                content,
                range: this.currentIndex.byId.get(sectionId),
            }))
            .filter(
                (
                    entry,
                ): entry is {
                    sectionId: string;
                    content: string;
                    range: SectionRange;
                } => Boolean(entry.range),
            )
            .sort((a, b) => b.range.markerStart - a.range.markerStart);

        const previousSource = this.currentSource;
        let nextSource = previousSource;
        for (const entry of ranges) {
            nextSource = patchSectionRange(
                nextSource,
                entry.range,
                entry.content,
            );
        }

        this.currentRevision += 1;
        const nextIndex = buildSectionIndex(nextSource, {
            sourceRevision: this.currentRevision,
        });
        if (!nextIndex.diagnostics.valid) {
            this.currentRevision -= 1;
            return null;
        }
        this.currentSource = nextSource;
        this.currentIndex = nextIndex;

        return {
            source: nextSource,
            index: nextIndex,
            revision: this.currentRevision,
            changedSections: ranges.map((entry) => entry.sectionId),
            bytesDelta:
                new TextEncoder().encode(nextSource).length -
                new TextEncoder().encode(previousSource).length,
        };
    }

    reconcileDocumentState(
        state: Pick<DocumentState, 'sections' | 'document'>,
        expectedRevision = this.currentRevision,
    ): SourceMutationResult | null {
        if (expectedRevision !== this.currentRevision) {
            throw new StaleSourceRevisionError(
                expectedRevision,
                this.currentRevision,
            );
        }
        if (!this.currentIndex.diagnostics.valid) return null;

        const desiredIds = Object.keys(state.sections.section_id).sort(
            compareSectionIds,
        );
        if (desiredIds.length === 0) return null;

        const currentIds = Array.from(
            new Set(this.currentIndex.sourceOrderedIds),
        );
        const desiredSet = new Set(desiredIds);
        const currentSet = new Set(currentIds);
        const removedIds = currentIds.filter(
            (sectionId) => !desiredSet.has(sectionId),
        );
        const addedIds = desiredIds.filter(
            (sectionId) => !currentSet.has(sectionId),
        );
        const changedSections: string[] = [];
        const operations: SourceOperation[] = [];

        for (const sectionId of currentIds) {
            if (!desiredSet.has(sectionId)) continue;
            const range = this.currentIndex.byId.get(sectionId);
            const nodeId = state.sections.section_id[sectionId];
            if (!range || !nodeId) return null;
            const nextContent = state.document.content[nodeId]?.content ?? '';
            if (nextContent === this.getContent(sectionId)) continue;
            const patched = patchSectionRange(
                this.currentSource,
                range,
                nextContent,
            );
            const suffixLength = this.currentSource.length - range.sectionEnd;
            operations.push({
                start: range.markerEnd,
                end: range.sectionEnd,
                replacement: patched.slice(
                    range.markerEnd,
                    patched.length - suffixLength,
                ),
                order: operations.length,
            });
            changedSections.push(sectionId);
        }

        const removedRoots = removedIds.filter(
            (sectionId) =>
                !removedIds.some(
                    (candidate) =>
                        candidate !== sectionId &&
                        isSectionInSubtree(sectionId, candidate),
                ),
        );
        for (const sectionId of removedRoots) {
            const range = this.currentIndex.byId.get(sectionId);
            if (!range) return null;
            operations.push({
                start: range.markerStart,
                end: resolveSubtreeEnd(
                    this.currentIndex,
                    sectionId,
                    this.currentSource.length,
                ),
                replacement: '',
                order: operations.length,
            });
            changedSections.push(sectionId);
        }

        const retainedIds = desiredIds.filter((sectionId) =>
            currentSet.has(sectionId),
        );
        const retainedSet = new Set(retainedIds);
        const contentBySection = new Map(
            addedIds.map((sectionId) => {
                const nodeId = state.sections.section_id[sectionId];
                return [
                    sectionId,
                    nodeId ? state.document.content[nodeId]?.content ?? '' : '',
                ] as const;
            }),
        );
        const insertions = new Map<number, string[]>();
        for (const sectionId of addedIds) {
            const desiredPosition = desiredIds.indexOf(sectionId);
            const nextRetained = desiredIds
                .slice(desiredPosition + 1)
                .find((candidate) => retainedSet.has(candidate));
            const insertAt = nextRetained
                ? this.currentIndex.byId.get(nextRetained)?.markerStart
                : this.currentSource.length;
            if (insertAt === undefined) return null;
            const group = insertions.get(insertAt) ?? [];
            group.push(sectionId);
            insertions.set(insertAt, group);
        }
        for (const [position, sectionIds] of insertions) {
            const orderedSectionIds = [...sectionIds].sort(
                (left, right) =>
                    desiredIds.indexOf(left) - desiredIds.indexOf(right),
            );
            const previousRetained = desiredIds
                .slice(0, desiredIds.indexOf(orderedSectionIds[0] ?? ''))
                .reverse()
                .find((candidate) => retainedSet.has(candidate));
            const lineEnding = resolveSourceLineEnding(this.currentSource);
            const previousRange = previousRetained
                ? this.currentIndex.byId.get(previousRetained)
                : undefined;
            const hasSeparatorBefore = previousRange
                ? this.currentSource
                      .slice(0, previousRange.sectionEnd)
                      .endsWith(lineEnding)
                : this.currentSource.slice(0, position).endsWith(lineEnding);
            operations.push({
                start: position,
                end: position,
                replacement: buildInsertedSectionBlock(
                    this.currentSource,
                    position,
                    orderedSectionIds,
                    contentBySection,
                    hasSeparatorBefore,
                ),
                order: desiredIds.indexOf(orderedSectionIds[0] ?? ''),
            });
            changedSections.push(...orderedSectionIds);
        }

        if (operations.length === 0) return null;

        let nextSource = this.currentSource;
        operations
            .sort((left, right) => {
                if (left.start !== right.start) return right.start - left.start;
                return right.order - left.order;
            })
            .forEach((operation) => {
                nextSource =
                    nextSource.slice(0, operation.start) +
                    operation.replacement +
                    nextSource.slice(operation.end);
            });

        const nextRevision = this.currentRevision + 1;
        const nextIndex = buildSectionIndex(nextSource, {
            sourceRevision: nextRevision,
        });
        if (
            !nextIndex.diagnostics.valid ||
            nextIndex.canonicalOrderedIds.join('|') !== desiredIds.join('|')
        ) {
            return null;
        }

        const previousSource = this.currentSource;
        this.currentSource = nextSource;
        this.currentRevision = nextRevision;
        this.currentIndex = nextIndex;
        return {
            source: nextSource,
            index: nextIndex,
            revision: nextRevision,
            changedSections: Array.from(new Set(changedSections)).sort(
                compareSectionIds,
            ),
            bytesDelta:
                new TextEncoder().encode(nextSource).length -
                new TextEncoder().encode(previousSource).length,
        };
    }
}
