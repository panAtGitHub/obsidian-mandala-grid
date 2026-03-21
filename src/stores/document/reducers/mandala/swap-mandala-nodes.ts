import {
    buildMandalaColumnsFromSections,
    createStableNodeId,
} from 'src/engine/mandala-document/build-state';
import {
    compareSectionIds,
    getParentSection,
    isSectionInSubtree,
    swapSectionSubtreeIds,
} from 'src/engine/mandala-document/section-utils';
import { id } from 'src/helpers/id';
import { SilentError } from 'src/lib/errors/errors';
import { findNodeColumn } from 'src/lib/tree-utils/find/find-node-column';
import { sortGroups } from 'src/lib/tree-utils/sort/sort-groups';
import {
    DocumentState,
    MandalaGridDocument,
    Sections,
} from 'src/stores/document/document-state-type';

export type MandalaSwapAction = {
    type: 'document/mandala/swap';
    payload: {
        sourceNodeId: string;
        targetNodeId: string;
    };
};

export type MandalaSwapMutation = {
    changedSections: string[];
    structural: boolean;
};

const getSectionSuffix = (sectionId: string, rootSection: string) =>
    sectionId === rootSection ? '' : sectionId.slice(rootSection.length);

const fromSuffix = (rootSection: string, suffix: string) =>
    suffix.length > 0 ? `${rootSection}${suffix}` : rootSection;

const compareSectionSuffixes = (
    rootSection: string,
    left: string,
    right: string,
) =>
    compareSectionIds(
        fromSuffix(rootSection, left),
        fromSuffix(rootSection, right),
    );

const compareSectionSuffixesDeepestFirst = (
    rootSection: string,
    left: string,
    right: string,
) => {
    const leftDepth = fromSuffix(rootSection, left).split('.').length;
    const rightDepth = fromSuffix(rootSection, right).split('.').length;
    if (leftDepth !== rightDepth) return rightDepth - leftDepth;
    return compareSectionSuffixes(rootSection, right, left);
};

const collectSubtreeSuffixes = (sections: Sections, rootSection: string) => {
    const suffixes = new Set<string>();
    for (const sectionId of Object.keys(sections.section_id)) {
        if (!isSectionInSubtree(sectionId, rootSection)) continue;
        suffixes.add(getSectionSuffix(sectionId, rootSection));
    }
    return suffixes;
};

const ensureContentEntry = (
    content: MandalaGridDocument['content'],
    nodeId: string,
) => {
    if (!content[nodeId]) {
        content[nodeId] = { content: '' };
    }
};

const ensureSectionNode = (
    state: DocumentState,
    sectionId: string,
    usedNodeIds: Set<string>,
) => {
    const existingNodeId = state.sections.section_id[sectionId];
    if (existingNodeId) {
        ensureContentEntry(state.document.content, existingNodeId);
        return { nodeId: existingNodeId, created: false };
    }

    const parentSection = getParentSection(sectionId);
    if (parentSection && !state.sections.section_id[parentSection]) {
        throw new SilentError(
            `could not materialize section "${sectionId}" without parent "${parentSection}"`,
        );
    }

    const nodeId = createStableNodeId(sectionId, usedNodeIds);
    state.sections.section_id[sectionId] = nodeId;
    state.sections.id_section[nodeId] = sectionId;
    state.document.content[nodeId] = { content: '' };
    return { nodeId, created: true };
};

const hasSectionDescendants = (sections: Sections, sectionId: string) => {
    const prefix = `${sectionId}.`;
    return Object.keys(sections.section_id).some((candidate) =>
        candidate.startsWith(prefix),
    );
};

const removeSectionNode = (state: DocumentState, sectionId: string) => {
    const nodeId = state.sections.section_id[sectionId];
    if (!nodeId) return;
    delete state.sections.section_id[sectionId];
    delete state.sections.id_section[nodeId];
    delete state.document.content[nodeId];
    state.pinnedNodes.Ids = state.pinnedNodes.Ids.filter((id) => id !== nodeId);
};

export const swapMandalaSubtreePayload = (
    state: DocumentState,
    sourceSection: string,
    targetSection: string,
): MandalaSwapMutation => {
    if (!sourceSection || !targetSection || sourceSection === targetSection) {
        return { changedSections: [], structural: false };
    }

    const sourceSuffixes = collectSubtreeSuffixes(
        state.sections,
        sourceSection,
    );
    const targetSuffixes = collectSubtreeSuffixes(
        state.sections,
        targetSection,
    );
    const suffixes = Array.from(
        new Set([...sourceSuffixes, ...targetSuffixes]),
    ).sort((left, right) => compareSectionSuffixes(sourceSection, left, right));
    const usedNodeIds = new Set(Object.values(state.sections.section_id));
    const removableSuffixes = new Set<string>();
    let structural = false;

    const pinnedSectionsBefore = state.pinnedNodes.Ids.map(
        (nodeId) => state.sections.id_section[nodeId],
    ).filter((sectionId): sectionId is string => Boolean(sectionId));

    for (const suffix of suffixes) {
        const sourceSectionId = fromSuffix(sourceSection, suffix);
        const targetSectionId = fromSuffix(targetSection, suffix);
        const sourceExists = Boolean(
            state.sections.section_id[sourceSectionId],
        );
        const targetExists = Boolean(
            state.sections.section_id[targetSectionId],
        );

        if (!sourceExists || !targetExists) {
            structural = true;
        }
        if (sourceExists !== targetExists) {
            removableSuffixes.add(suffix);
        }

        ensureSectionNode(state, sourceSectionId, usedNodeIds);
        ensureSectionNode(state, targetSectionId, usedNodeIds);
    }

    const changedSections = new Set<string>();
    for (const suffix of suffixes) {
        const sourceSectionId = fromSuffix(sourceSection, suffix);
        const targetSectionId = fromSuffix(targetSection, suffix);
        const sourceNodeId = state.sections.section_id[sourceSectionId];
        const targetNodeId = state.sections.section_id[targetSectionId];
        if (!sourceNodeId || !targetNodeId) continue;

        ensureContentEntry(state.document.content, sourceNodeId);
        ensureContentEntry(state.document.content, targetNodeId);

        const sourceContent =
            state.document.content[sourceNodeId]?.content ?? '';
        const targetContent =
            state.document.content[targetNodeId]?.content ?? '';
        if (sourceContent === targetContent) continue;

        state.document.content[sourceNodeId] = { content: targetContent };
        state.document.content[targetNodeId] = { content: sourceContent };
        changedSections.add(sourceSectionId);
        changedSections.add(targetSectionId);
    }

    const nextPinnedSections = swapSectionSubtreeIds(
        pinnedSectionsBefore,
        sourceSection,
        targetSection,
    );
    state.pinnedNodes.Ids = nextPinnedSections
        .map((sectionId) => state.sections.section_id[sectionId])
        .filter((nodeId): nodeId is string => Boolean(nodeId));

    for (const suffix of Array.from(removableSuffixes).sort((left, right) =>
        compareSectionSuffixesDeepestFirst(sourceSection, left, right),
    )) {
        const sourceSectionId = fromSuffix(sourceSection, suffix);
        const targetSectionId = fromSuffix(targetSection, suffix);

        for (const sectionId of [sourceSectionId, targetSectionId]) {
            if (sectionId === sourceSection || sectionId === targetSection)
                continue;
            if (!state.sections.section_id[sectionId]) continue;
            if (hasSectionDescendants(state.sections, sectionId)) continue;

            const nodeId = state.sections.section_id[sectionId];
            const content = nodeId
                ? state.document.content[nodeId]?.content ?? ''
                : '';
            if (content.length > 0) continue;

            removeSectionNode(state, sectionId);
        }
    }

    if (structural) {
        const orderedSections = Object.keys(state.sections.section_id).sort(
            compareSectionIds,
        );
        state.document.columns = buildMandalaColumnsFromSections(
            orderedSections,
            state.sections.section_id,
            state.meta.mandalaV2.rootGroupId ?? undefined,
        );
    }

    return {
        changedSections: Array.from(changedSections).sort(compareSectionIds),
        structural,
    };
};

export type MandalaEnsureChildrenAction = {
    type: 'document/mandala/ensure-children';
    payload: {
        parentNodeId: string;
        count?: number;
    };
};

export type MandalaEnsureCoreThemeAction = {
    type: 'document/mandala/ensure-core-theme';
    payload: {
        theme: string;
    };
};

export type MandalaClearEmptySubgridsAction = {
    type: 'document/mandala/clear-empty-subgrids';
    payload: {
        parentIds: string[];
        rootNodeIds: string[];
        activeNodeId: string;
    };
};

export const ensureMandalaChildren = (
    document: MandalaGridDocument,
    parentNodeId: string,
    childCount = 8,
): string[] => {
    if (childCount <= 0) return [];

    const parentColumnIndex = findNodeColumn(document.columns, parentNodeId);
    if (parentColumnIndex === -1) {
        throw new SilentError('could not find parent column');
    }

    const childColumnIndex = parentColumnIndex + 1;

    const createNode = () => {
        const nodeId = id.node();
        document.content[nodeId] = { content: '' };
        return nodeId;
    };

    const createChildren = (count: number) =>
        Array.from({ length: count }, () => createNode());

    const childColumn = document.columns[childColumnIndex];
    if (!childColumn) {
        const nodes = createChildren(childCount);
        document.columns.push({
            id: id.column(),
            groups: [{ parentId: parentNodeId, nodes }],
        });
        document.columns = [...document.columns];
        return nodes;
    }

    const existingGroup = childColumn.groups.find(
        (group) => group.parentId === parentNodeId,
    );

    if (!existingGroup) {
        const nodes = createChildren(childCount);
        childColumn.groups.push({ parentId: parentNodeId, nodes });
        childColumn.groups = sortGroups(
            document.columns[parentColumnIndex].groups,
            childColumn.groups,
        );
        childColumn.groups = [...childColumn.groups];
        return nodes;
    }

    if (existingGroup.nodes.length >= childCount) return [];

    const missing = childCount - existingGroup.nodes.length;
    const nodes = createChildren(missing);
    existingGroup.nodes = [...existingGroup.nodes, ...nodes];
    childColumn.groups = [...childColumn.groups];
    return nodes;
};

export const ensureMandalaCoreTheme = (
    document: MandalaGridDocument,
    _theme: string,
): { nodeId: string; created: boolean } => {
    void _theme;
    const rootGroup = document.columns[0]?.groups?.[0];
    if (!rootGroup) {
        throw new SilentError('could not find root group');
    }

    const nodeId = id.node();
    rootGroup.nodes = [...rootGroup.nodes, nodeId];
    document.content[nodeId] = { content: '' };
    document.columns = [...document.columns];
    return { nodeId, created: true };
};
