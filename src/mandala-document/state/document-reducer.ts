import { loadDocumentFromFile } from 'src/mandala-document/state/reducers/load-document-from-file/load-document-from-file';
import {
    setMultipleNodeContent,
    setNodeContent,
} from 'src/mandala-document/state/reducers/content/set-node-content';
import { DocumentState } from 'src/mandala-document/state/document-state-type';
import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';

import { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import { formatHeadings } from 'src/mandala-document/state/reducers/content/format-content/format-headings';
import { getIdOfSection } from 'src/stores/view/subscriptions/helpers/get-id-of-section';
import { getSectionOfId } from 'src/stores/view/subscriptions/helpers/get-section-of-id';
import { pinNode } from 'src/mandala-document/state/reducers/pinned-nodes/pin-node';
import { unpinNode } from 'src/mandala-document/state/reducers/pinned-nodes/unpin-node';
import { removeStalePinnedNodes } from 'src/mandala-document/state/reducers/pinned-nodes/remove-stale-pinned-nodes';
import { loadPinnedNodes } from 'src/mandala-document/state/reducers/pinned-nodes/load-pinned-nodes';
import { refreshGroupParentIds } from 'src/mandala-document/state/reducers/meta/refresh-group-parent-ids';
import { NO_UPDATE } from 'src/shared/store/store';
import { deleteChildNodes } from 'src/mandala-document/tree-utils/delete/delete-child-nodes';
import { deleteNodeById } from 'src/mandala-document/tree-utils/delete/delete-node-by-id';
import {
    ensureMandalaChildren,
    ensureMandalaCoreTheme,
    swapMandalaSubtreePayload,
} from 'src/mandala-document/state/reducers/mandala/swap-mandala-nodes';
import {
    applyMandalaContentDelta,
    rebuildMandalaV2MetaFromSections,
    registerMandalaChildSections,
    registerMandalaSection,
    removeMandalaDescendantSectionsByParents,
    removeMandalaSubtreeSectionsByRoots,
} from 'src/mandala-document/state/reducers/mandala/mandala-slot-authority';

type EarlyReturnHandler = (
    state: DocumentState,
    action: DocumentStoreAction,
) => void;

const earlyReturnHandlers: Record<string, EarlyReturnHandler> = {
    'document/file/update-frontmatter': (state, action) => {
        if (action.type !== 'document/file/update-frontmatter') return;
        state.file.frontmatter = action.payload.frontmatter;
    },
    'document/pinned-nodes/pin': (state, action) => {
        if (action.type !== 'document/pinned-nodes/pin') return;
        pinNode(state.sections, state.pinnedNodes, action.payload.id);
    },
    'document/pinned-nodes/unpin': (state, action) => {
        if (action.type !== 'document/pinned-nodes/unpin') return;
        unpinNode(state.pinnedNodes, action.payload.id);
    },
    'document/pinned-nodes/remove-stale-nodes': (state, action) => {
        if (action.type !== 'document/pinned-nodes/remove-stale-nodes') return;
        removeStalePinnedNodes(state.pinnedNodes, state.sections);
    },
    'document/pinned-nodes/load-from-settings': (state, action) => {
        if (action.type !== 'document/pinned-nodes/load-from-settings') return;
        loadPinnedNodes(
            state.pinnedNodes,
            state.sections,
            action.payload.sections,
        );
    },
    'document/meta/refresh-group-parent-ids': (state, action) => {
        if (action.type !== 'document/meta/refresh-group-parent-ids') return;
        refreshGroupParentIds(state.document.columns, state.meta);
    },
};

const updateDocumentState = (
    state: DocumentState,
    action: DocumentStoreAction,
) => {
    let newActiveNodeId: null | string = null;
    let affectedNodeId: null | string = null;
    let needsMandalaV2MetaRebuild = false;
    state.meta.mandalaV2.lastMutation = null;
    if (action.type === 'document/update-node-content') {
        const previousContent =
            state.document.content[action.payload.nodeId]?.content ?? '';
        const update = setNodeContent(state.document.content, action);
        if (!update) return NO_UPDATE;
        state.meta.mandalaV2.contentRevision += 1;
        applyMandalaContentDelta(
            state,
            action.payload.nodeId,
            previousContent,
            action.payload.content,
        );
        newActiveNodeId = action.payload.nodeId;
    } else if (action.type === 'document/update-multiple-node-content') {
        const previousContentByNodeId = new Map<string, string>();
        for (const update of action.payload.updates) {
            previousContentByNodeId.set(
                update.nodeId,
                state.document.content[update.nodeId]?.content ?? '',
            );
        }
        const changedNodeIds = setMultipleNodeContent(
            state.document.content,
            action,
        );
        if (changedNodeIds.length === 0) return NO_UPDATE;
        state.meta.mandalaV2.contentRevision += 1;
        for (const nodeId of changedNodeIds) {
            applyMandalaContentDelta(
                state,
                nodeId,
                previousContentByNodeId.get(nodeId) ?? '',
                state.document.content[nodeId]?.content ?? '',
            );
        }
        newActiveNodeId = changedNodeIds[0];
        affectedNodeId = changedNodeIds[0];
    } else if (action.type === 'document/mandala/swap') {
        const sourceSection =
            state.sections.id_section[action.payload.sourceNodeId];
        const targetSection =
            state.sections.id_section[action.payload.targetNodeId];
        if (!sourceSection || !targetSection) return NO_UPDATE;
        if (sourceSection === '1' || targetSection === '1') return NO_UPDATE;

        const sourceLastDot = sourceSection.lastIndexOf('.');
        const targetLastDot = targetSection.lastIndexOf('.');
        const sourceIsLeaf = sourceLastDot !== -1;
        const targetIsLeaf = targetLastDot !== -1;
        const sourceDepth = sourceSection.split('.').length;
        const targetDepth = targetSection.split('.').length;
        if (sourceIsLeaf !== targetIsLeaf) return NO_UPDATE;
        if (sourceDepth !== targetDepth) return NO_UPDATE;

        if (!sourceIsLeaf) {
            const s = Number(sourceSection);
            const t = Number(targetSection);
            if (!(s >= 2 && s <= 9 && t >= 2 && t <= 9)) return NO_UPDATE;
        } else {
            const si = Number(sourceSection.slice(sourceLastDot + 1));
            const ti = Number(targetSection.slice(targetLastDot + 1));
            if (!(si >= 1 && si <= 8 && ti >= 1 && ti <= 8)) return NO_UPDATE;
        }

        const mutation = swapMandalaSubtreePayload(
            state,
            sourceSection,
            targetSection,
        );
        state.meta.mandalaV2.lastMutation = {
            actionType: action.type,
            changedSections: mutation.changedSections,
            structural: mutation.structural,
        };
        needsMandalaV2MetaRebuild = true;
        newActiveNodeId = action.payload.sourceNodeId;
        affectedNodeId = action.payload.sourceNodeId;
    } else if (action.type === 'document/mandala/ensure-children') {
        const section = state.sections.id_section[action.payload.parentNodeId];
        if (!section) return NO_UPDATE;

        const createdNodes = ensureMandalaChildren(
            state.document,
            action.payload.parentNodeId,
            8,
        );
        if (createdNodes.length === 0) return NO_UPDATE;
        registerMandalaChildSections(
            state,
            action.payload.parentNodeId,
            createdNodes,
            { commit: false },
        );
        needsMandalaV2MetaRebuild = true;

        newActiveNodeId = action.payload.parentNodeId;
        affectedNodeId = action.payload.parentNodeId;
    } else if (action.type === 'document/mandala/ensure-core-theme') {
        const theme = action.payload.theme;
        const existingNodeId = state.sections.section_id[theme];
        if (existingNodeId) {
            const createdNodes = ensureMandalaChildren(
                state.document,
                existingNodeId,
                8,
            );
            registerMandalaChildSections(state, existingNodeId, createdNodes, {
                commit: false,
            });
            needsMandalaV2MetaRebuild = createdNodes.length > 0;
            newActiveNodeId = existingNodeId;
            affectedNodeId = existingNodeId;
        } else {
            const { nodeId } = ensureMandalaCoreTheme(state.document, theme);
            registerMandalaSection(state, nodeId, theme, { commit: false });
            const createdNodes = ensureMandalaChildren(
                state.document,
                nodeId,
                8,
            );
            registerMandalaChildSections(state, nodeId, createdNodes, {
                commit: false,
            });
            needsMandalaV2MetaRebuild = true;
            newActiveNodeId = nodeId;
            affectedNodeId = null;
        }
    } else if (action.type === 'document/mandala/clear-empty-subgrids') {
        const parentIds = action.payload.parentIds.filter(Boolean);
        const rootNodeIds = action.payload.rootNodeIds.filter(Boolean);
        if (parentIds.length === 0 && rootNodeIds.length === 0)
            return NO_UPDATE;
        removeMandalaDescendantSectionsByParents(state, parentIds, {
            commit: false,
        });
        for (const parentId of parentIds) {
            deleteChildNodes(state.document, parentId);
        }
        removeMandalaSubtreeSectionsByRoots(state, rootNodeIds, {
            commit: false,
        });
        for (const rootNodeId of rootNodeIds) {
            deleteChildNodes(state.document, rootNodeId);
            deleteNodeById(
                state.document.columns,
                state.document.content,
                rootNodeId,
            );
        }
        needsMandalaV2MetaRebuild = true;
        newActiveNodeId = action.payload.activeNodeId;
        affectedNodeId = action.payload.activeNodeId;
    } else if (action.type === 'document/file/load-from-disk') {
        newActiveNodeId = loadDocumentFromFile(state, action);
    } else if (action.type === 'document/format-headings') {
        formatHeadings(state.document.content, state.sections);
        state.meta.mandalaV2.contentRevision += 1;
        newActiveNodeId = getIdOfSection(
            state.sections,
            state.history.context.activeSection,
        );
    } else {
        const handler = earlyReturnHandlers[action.type];
        if (handler) {
            handler(state, action);
        }
        return;
    }

    const e = getDocumentEventType(action, state);

    let affectedSection: string | null = null;

    if (affectedNodeId) {
        affectedSection = getSectionOfId(state.sections, affectedNodeId);
    }

    if (needsMandalaV2MetaRebuild) {
        rebuildMandalaV2MetaFromSections(state);
    }

    // if file was modified externally, try to maintain active section
    if (action.type === 'document/file/load-from-disk') {
        const activeSection = action.payload.activeSection;
        if (activeSection) {
            const id = state.sections.section_id[activeSection];
            if (id) {
                newActiveNodeId = id;
            }
        }
    }

    const contentShapeCreation = e.content || e.dropOrMove || e.createOrDelete;
    if (newActiveNodeId && (contentShapeCreation || e.clipboard)) {
        const newActiveSection = getSectionOfId(
            state.sections,
            newActiveNodeId,
        );
        state.history.context = {
            activeSection: affectedSection || newActiveSection,
        };
    }
};

export const documentReducer = (
    store: DocumentState,
    action: DocumentStoreAction,
) => {
    const result = updateDocumentState(store, action);
    if (result === NO_UPDATE) return NO_UPDATE;
    return store;
};
