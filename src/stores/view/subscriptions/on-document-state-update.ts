import { MandalaView } from 'src/view/view';
import { DocumentStoreAction } from 'src/mandala-document/state/document-store-actions';
import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';
import { setActiveNode } from 'src/stores/view/subscriptions/actions/set-active-node';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { persistPinnedNodes } from 'src/stores/view/subscriptions/actions/persist-pinned-nodes';
import { updateStaleActivePinnedNode } from 'src/stores/view/subscriptions/actions/update-stale-active-pinned-node';
import { setActivePinnedNode } from 'src/stores/view/subscriptions/actions/set-active-pinned-node';
import { updateSelectedNodes } from 'src/stores/view/subscriptions/actions/update-selected-nodes';
import { loadPinnedNodesToDocument } from 'src/stores/view/subscriptions/actions/load-pinned-nodes-to-document';
import { updateSearchResults } from 'src/stores/view/subscriptions/actions/update-search-results';
import { isStructuralDocumentChange } from 'src/stores/view/subscriptions/helpers/is-structural-document-change';
import { syncSwapSideEffects } from 'src/stores/view/subscriptions/effects/document-sync/sync-swap-side-effects';

type SaveOptions = {
    mode: 'content-only' | 'structural';
    changedSections?: string[];
} | null;

const createSaveOptions = (
    view: MandalaView,
    action: DocumentStoreAction,
): SaveOptions => {
    const documentState = view.documentStore.getValue();
    if (action.type === 'document/update-node-content') {
        const sectionId =
            documentState.sections.id_section[action.payload.nodeId];
        if (sectionId) {
            return {
                mode: 'content-only',
                changedSections: [sectionId],
            };
        }
    }
    if (action.type === 'document/update-multiple-node-content') {
        const sections = action.payload.updates
            .map((update) => documentState.sections.id_section[update.nodeId])
            .filter((section): section is string => Boolean(section));
        if (sections.length > 0) {
            return {
                mode: 'content-only',
                changedSections: sections,
            };
        }
    }
    if (action.type === 'document/mandala/swap') {
        const mutation = documentState.meta.mandalaV2.lastMutation;
        if (mutation?.actionType === action.type) {
            if (!mutation.structural && mutation.changedSections.length === 0) {
                return null;
            }
            return {
                mode: mutation.structural ? 'structural' : 'content-only',
                changedSections: mutation.changedSections,
            };
        }
        return { mode: 'structural' };
    }
    if (action.type === 'document/format-headings') {
        return { mode: 'structural' };
    }
    return { mode: 'structural' };
};

export const onDocumentStateUpdate = (
    view: MandalaView,
    action: DocumentStoreAction,
) => {
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const viewStore = view.viewStore;
    const container = view.container;

    viewStore.setContext(documentState.document);
    const type = action.type;

    const e = getDocumentEventType(action, documentState);
    view.documentSearch.applyDocumentAction(action, documentState);
    if (type === 'document/file/load-from-disk') {
        // needed when the file was modified externally
        // to prevent saving a node with an obsolete node-id
        view.inlineEditor.unloadNode();
        loadPinnedNodesToDocument(view);
    }

    const structuralChange = isStructuralDocumentChange(documentState, action);
    if (structuralChange) {
        viewStore.batch(() => {
            setActiveNode(view, action);
            viewStore.dispatch({
                type: 'view/update-active-branch?source=document',
                context: {
                    documentAction: action,
                },
            });
            updateSelectedNodes(view);
        });
        documentStore.batch(() => {
            documentStore.dispatch({
                type: 'document/pinned-nodes/remove-stale-nodes',
            });
            documentStore.dispatch({
                type: 'document/meta/refresh-group-parent-ids',
            });
        });
    }

    // effects
    if (e.content) {
        view.alignBranch.align(action);
    }

    if (!container || !view.isViewOfFile) return;

    if (e.content || structuralChange) {
        const saveOptions = createSaveOptions(view, action);
        if (saveOptions) {
            void view.saveDocument(saveOptions);
        }
    }

    if (e.content || structuralChange) {
        const query = viewStore.getValue().search.query;
        if (query) {
            updateSearchResults(view);
        }
    }
    if (structuralChange) {
        view.plugin.statusBar.updateAll(view);
    }

    if (e.content || structuralChange) {
        if (view.isActive) focusContainer(view);
    }

    const pinnedNodesUpdate =
        type === 'document/pinned-nodes/remove-stale-nodes' ||
        type === 'document/pinned-nodes/pin' ||
        type === 'document/pinned-nodes/unpin';

    if (pinnedNodesUpdate) {
        persistPinnedNodes(view);
    }
    if (type === 'document/mandala/swap') {
        syncSwapSideEffects(view, action);
    }
    if (
        pinnedNodesUpdate ||
        type === 'document/pinned-nodes/load-from-settings'
    ) {
        if (type === 'document/pinned-nodes/pin') {
            setActivePinnedNode(view, action.payload.id);
        } else {
            updateStaleActivePinnedNode(view);
        }
    }
};
