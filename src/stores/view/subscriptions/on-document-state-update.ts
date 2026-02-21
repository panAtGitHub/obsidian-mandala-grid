import { MandalaView } from 'src/view/view';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';
import { setActiveNode } from 'src/stores/view/subscriptions/actions/set-active-node';
import { enableEditMode } from 'src/stores/view/subscriptions/actions/enable-edit-mode';
import { removeObsoleteNavigationItems } from 'src/stores/view/subscriptions/actions/remove-obsolete-navigation-items';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { persistPinnedNodes } from 'src/stores/view/subscriptions/actions/persist-pinned-nodes';
import { updateStaleActivePinnedNode } from 'src/stores/view/subscriptions/actions/update-stale-active-pinned-node';
import { setActivePinnedNode } from 'src/stores/view/subscriptions/actions/set-active-pinned-node';
import { updateSelectedNodes } from 'src/stores/view/subscriptions/actions/update-selected-nodes';
import { loadPinnedNodesToDocument } from 'src/stores/view/subscriptions/actions/load-pinned-nodes-to-document';
import {
    createSectionColorIndex,
    serializeSectionColorMapForSettings,
    swapSectionColors,
} from 'src/view/helpers/mandala/section-colors';
import { getCurrentFileSectionColorMap } from 'src/lib/mandala/current-file-mandala-settings';

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

    const e = getDocumentEventType(type);
    if (type === 'document/file/load-from-disk') {
        // needed when the file was modified externally
        // to prevent saving a node with an obsolete node-id
        view.inlineEditor.unloadNode();
        loadPinnedNodesToDocument(view);
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
        documentStore.dispatch({
            type: 'document/meta/refresh-group-parent-ids',
        });
    }

    if (structuralChange && type !== 'document/move-node') {
        updateSelectedNodes(view, action, e.changeHistory!);
    }

    if (type === 'document/add-node' && view.isActive) {
        enableEditMode(viewStore, documentState);
    }

    if (
        type === 'document/delete-node' ||
        type === 'document/cut-node' ||
        e.changeHistory ||
        type === 'document/extract-node' ||
        type === 'document/file/load-from-disk' ||
        type === 'document/split-node'
    ) {
        removeObsoleteNavigationItems(viewStore, documentState);
    }

    // effects
    if (e.content) {
        view.alignBranch.align(action);
    }
    if (structuralChange || e.content) {
        void view.rulesProcessor.onDocumentUpdate(action);
    }

    if (!container || !view.isViewOfFile) return;

    if (e.content || structuralChange) {
        void view.saveDocument();
    }

    if (e.content || structuralChange) {
        if (view.minimapStore) {
            view.minimapEffects.drawDocument(view);
        }

        view.documentSearch.resetIndex();
        const query = viewStore.getValue().search.query;
        if (query) {
            view.viewStore.dispatch({
                type: 'view/search/set-query',
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
    if (type === 'document/mandala/swap' && view.file) {
        const sourceSection =
            documentState.sections.id_section[action.payload.sourceNodeId];
        const targetSection =
            documentState.sections.id_section[action.payload.targetNodeId];
        if (sourceSection && targetSection) {
            const sectionColorMap = getCurrentFileSectionColorMap(view);
            const index = createSectionColorIndex(sectionColorMap);
            const sourceColor = index[sourceSection] ?? null;
            const targetColor = index[targetSection] ?? null;
            if (sourceColor !== targetColor) {
                const nextMap = swapSectionColors(
                    sectionColorMap,
                    sourceSection,
                    targetSection,
                );
                view.plugin.settings.dispatch({
                    type: 'settings/documents/persist-mandala-section-colors',
                    payload: {
                        path: view.file.path,
                        map: serializeSectionColorMapForSettings(nextMap),
                    },
                });
            }
        }
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
