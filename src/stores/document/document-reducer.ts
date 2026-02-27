import { insertNode } from 'src/stores/document/reducers/insert-node/insert-node';
import { dropNode } from 'src/stores/document/reducers/drop-node/drop-node';
import { loadDocumentFromFile } from 'src/stores/document/reducers/load-document-from-file/load-document-from-file';
import {
    setMultipleNodeContent,
    setNodeContent,
} from 'src/stores/document/reducers/content/set-node-content';
import { deleteNode } from 'src/stores/document/reducers/delete-node/delete-node';
import { moveNode } from 'src/stores/document/reducers/move-node/move-node';
import { DocumentState } from 'src/stores/document/document-state-type';
import { mergeNode } from 'src/stores/document/reducers/merge-node/merge-node';
import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';

import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { formatHeadings } from 'src/stores/document/reducers/content/format-content/format-headings';
import { pasteNode } from 'src/stores/document/reducers/clipboard/paste-node/paste-node';
import { updateSectionsDictionary } from 'src/stores/document/reducers/state/update-sections-dictionary';
import { getIdOfSection } from 'src/stores/view/subscriptions/helpers/get-id-of-section';
import { removeExtractedBranch } from 'src/stores/document/reducers/extract-node/remove-extracted-branch';
import { getSectionOfId } from 'src/stores/view/subscriptions/helpers/get-section-of-id';
import { splitNode } from 'src/stores/document/reducers/split-node/split-node';
import { pinNode } from 'src/stores/document/reducers/pinned-nodes/pin-node';
import { unpinNode } from 'src/stores/document/reducers/pinned-nodes/unpin-node';
import { removeStalePinnedNodes } from 'src/stores/document/reducers/pinned-nodes/remove-stale-pinned-nodes';
import { loadPinnedNodes } from 'src/stores/document/reducers/pinned-nodes/load-pinned-nodes';
import { refreshGroupParentIds } from 'src/stores/document/reducers/meta/refresh-group-parent-ids';
import { loadDocumentFromJSON } from 'src/stores/document/reducers/load-document-from-file/load-document-from-json';
import { NO_UPDATE } from 'src/lib/store/store';
import { sortDirectChildNodes } from 'src/stores/document/reducers/sort/sort-direct-child-nodes';
import { deleteChildNodes } from 'src/lib/tree-utils/delete/delete-child-nodes';
import {
    ensureMandalaChildren,
    ensureMandalaCoreTheme,
    swapMandalaNodes,
} from 'src/stores/document/reducers/mandala/swap-mandala-nodes';

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
        if (action.type !== 'document/pinned-nodes/load-from-settings')
            return;
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
    if (
        state.meta.isMandala &&
        (action.type === 'document/add-node' ||
            action.type === 'document/delete-node' ||
            action.type === 'document/drop-node' ||
            action.type === 'document/move-node' ||
            action.type === 'document/paste-node' ||
            action.type === 'document/merge-node' ||
            action.type === 'document/extract-node' ||
            action.type === 'document/split-node' ||
            action.type === 'document/sort-direct-child-nodes')
    ) {
        return NO_UPDATE;
    }
    if (action.type === 'document/update-node-content') {
        const update = setNodeContent(state.document.content, action);
        if (!update) return NO_UPDATE;
        newActiveNodeId = action.payload.nodeId;
    } else if (action.type === 'document/update-multiple-node-content') {
        const changedNodeIds = setMultipleNodeContent(state.document.content, action);
        if (changedNodeIds.length === 0) return NO_UPDATE;
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

        swapMandalaNodes(
            state.document,
            action.payload.sourceNodeId,
            action.payload.targetNodeId,
        );
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
            if (createdNodes.length === 0) {
                newActiveNodeId = existingNodeId;
                affectedNodeId = existingNodeId;
            } else {
                newActiveNodeId = existingNodeId;
                affectedNodeId = existingNodeId;
            }
        } else {
            const { nodeId } = ensureMandalaCoreTheme(state.document, theme);
            ensureMandalaChildren(
                state.document,
                nodeId,
                8,
            );
            newActiveNodeId = nodeId;
            affectedNodeId = null;
        }
    } else if (action.type === 'document/mandala/clear-empty-subgrids') {
        const parentIds = action.payload.parentIds.filter(Boolean);
        if (parentIds.length === 0) return NO_UPDATE;
        for (const parentId of parentIds) {
            deleteChildNodes(state.document, parentId);
        }
        newActiveNodeId = action.payload.activeNodeId;
        affectedNodeId = action.payload.activeNodeId;
    } else if (action.type === 'document/add-node') {
        newActiveNodeId = insertNode(
            state.document,
            action.payload.position,
            action.payload.activeNodeId,
            action.payload.content,
        );
    } else if (action.type === 'document/delete-node') {
        newActiveNodeId = deleteNode(
            state.document,
            action.payload.activeNodeId,
            action.payload.selectedNodes,
        );
        affectedNodeId = action.payload.activeNodeId;
    } else if (action.type === 'document/extract-node') {
        const update = setNodeContent(state.document.content, {
            payload: {
                nodeId: action.payload.nodeId,
                content: `[[${action.payload.documentName}]]`,
            },
        });
        if (!update) return NO_UPDATE;
        removeExtractedBranch(state.document, action);
        newActiveNodeId = action.payload.nodeId;
    } else if (action.type === 'document/split-node') {
        affectedNodeId = action.payload.target;
        newActiveNodeId = splitNode(state.document, action);
    } else if (action.type === 'document/drop-node') {
        dropNode(state.document, action);
        newActiveNodeId = action.payload.droppedNodeId;
    } else if (action.type === 'document/move-node') {
        moveNode(state.document, action);
        newActiveNodeId = action.payload.activeNodeId;
        affectedNodeId = newActiveNodeId;
    } else if (action.type === 'document/merge-node') {
        newActiveNodeId = mergeNode(state.document, action);
        affectedNodeId = action.payload.activeNodeId;
    } else if (action.type === 'document/sort-direct-child-nodes') {
        sortDirectChildNodes(state.document, action.payload);
        newActiveNodeId = action.payload.id;
        affectedNodeId = newActiveNodeId;
    } else if (action.type === 'document/file/load-from-disk') {
        if (action.payload.__test_document__) {
            newActiveNodeId = loadDocumentFromJSON(
                state,
                action.payload.__test_document__,
            );
        } else {
            newActiveNodeId = loadDocumentFromFile(state, action);
        }
    } else if (
        action.type === 'document/history/select-snapshot' ||
        action.type === 'document/history/select-previous-snapshot' ||
        action.type === 'document/history/select-next-snapshot'
    ) {
        return NO_UPDATE;
    } else if (action.type === 'document/format-headings') {
        formatHeadings(state.document.content, state.sections);
        newActiveNodeId = getIdOfSection(
            state.sections,
            state.history.context.activeSection,
        );
    } else if (action.type === 'document/paste-node') {
        const result = pasteNode(state.document, action);
        newActiveNodeId = result.nextNode;
    } else if (action.type === 'document/cut-node') {
        newActiveNodeId = deleteNode(
            state.document,
            action.payload.nodeId,
            action.payload.selectedNodes,
        );
        affectedNodeId = action.payload.nodeId;
    } else {
        const handler = earlyReturnHandlers[action.type];
        if (handler) {
            handler(state, action);
        }
        return;
    }

    const e = getDocumentEventType(action.type);

    let affectedSection: string | null = null;

    if (affectedNodeId) {
        affectedSection = getSectionOfId(state.sections, affectedNodeId);
    }
    const shouldUpdateSections =
        e.dropOrMove || e.createOrDelete || e.changeHistory || e.clipboard;
    const skipSectionRefreshForV2Load =
        action.type === 'document/file/load-from-disk' &&
        state.meta.mandalaV2.enabled;
    if (shouldUpdateSections && !skipSectionRefreshForV2Load) {
        updateSectionsDictionary(state);
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
