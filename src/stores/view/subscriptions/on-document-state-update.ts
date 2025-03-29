import { LineageView } from 'src/view/view';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import {
    DocumentEventType,
    getDocumentEventType,
} from 'src/stores/view/helpers/get-document-event-type';
import { setActiveNode } from 'src/stores/view/subscriptions/actions/set-active-node';
import { enableEditMode } from 'src/stores/view/subscriptions/actions/enable-edit-mode';
import { removeObsoleteNavigationItems } from 'src/stores/view/subscriptions/actions/remove-obsolete-navigation-items';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { persistPinnedNodes } from 'src/stores/view/subscriptions/actions/persist-pinned-nodes';
import { updateStaleActivePinnedNode } from 'src/stores/view/subscriptions/actions/update-stale-active-pinned-node';
import { setActivePinnedNode } from 'src/stores/view/subscriptions/actions/set-active-pinned-node';
import { updateSelectedNodes } from 'src/stores/view/subscriptions/actions/update-selected-nodes';

export const onDocumentStateUpdate = (
    view: LineageView,
    action: DocumentStoreAction,
) => {
    const documentStore = view.documentStore;
    const documentState = documentStore.getValue();
    const viewStore = view.viewStore;
    const container = view.container;

    viewStore.setContext(documentState.document);
    const type = action.type;

    const e: DocumentEventType | null = getDocumentEventType(
        type as DocumentStoreAction['type'],
    );
    if (type === 'DOCUMENT/LOAD_FILE') {
        // needed when the file was modified externally
        // to prevent saving a node with an obsolete node-id
        view.inlineEditor.unloadNode();
    }

    const structuralChange =
        e.createOrDelete || e.dropOrMove || e.changeHistory || e.clipboard;
    if (structuralChange) {
        setActiveNode(view, action);

        viewStore.dispatch({
            type: 'view/update-active-branch?source=document',
            context: {
                documentAction: action,
            },
        });
        viewStore.dispatch({
            type: 'view/outline/refresh-collapsed-nodes',
        });
        documentStore.dispatch({
            type: 'document/pinned-nodes/remove-stale-nodes',
        });
        documentStore.dispatch({ type: 'META/REFRESH_GROUP_PARENT_IDS' });
    }

    if (structuralChange && type !== 'DOCUMENT/MOVE_NODE') {
        updateSelectedNodes(view, action, e.changeHistory!);
    }

    if (type === 'DOCUMENT/INSERT_NODE' && view.isActive) {
        enableEditMode(viewStore, documentState);
    }

    if (
        type === 'DOCUMENT/DELETE_NODE' ||
        type === 'DOCUMENT/CUT_NODE' ||
        e.changeHistory ||
        type === 'DOCUMENT/EXTRACT_BRANCH' ||
        type === 'DOCUMENT/LOAD_FILE' ||
        type === 'DOCUMENT/SPLIT_NODE'
    ) {
        removeObsoleteNavigationItems(viewStore, documentState);
    }

    // effects
    if (e.content) {
        view.alignBranch.align(action);
    }
    if (structuralChange || e.content) {
        view.rulesProcessor.onDocumentUpdate(action);
    }

    if (!container || !view.isViewOfFile) return;

    if (e.content || structuralChange) {
        const maybeViewIsClosing = !view.isActive;
        view.saveDocument(maybeViewIsClosing);
    }

    if (e.content || structuralChange) {
        if (view.minimapStore) {
            view.minimapEffects.drawDocument(view);
        }

        view.documentSearch.resetIndex();
        const query = viewStore.getValue().search.query;
        if (query) {
            view.viewStore.dispatch({
                type: 'SEARCH/SET_QUERY',
                payload: {
                    query,
                },
            });
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
