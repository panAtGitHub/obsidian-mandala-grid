import { MandalaView } from 'src/view/view';
import { DocumentStoreAction } from 'src/stores/document/document-store-actions';
import { getDocumentEventType } from 'src/stores/view/helpers/get-document-event-type';
import { setActiveNode } from 'src/stores/view/subscriptions/actions/set-active-node';
import { enableEditMode } from 'src/stores/view/subscriptions/actions/enable-edit-mode';
import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
import { persistPinnedNodes } from 'src/stores/view/subscriptions/actions/persist-pinned-nodes';
import { updateStaleActivePinnedNode } from 'src/stores/view/subscriptions/actions/update-stale-active-pinned-node';
import { setActivePinnedNode } from 'src/stores/view/subscriptions/actions/set-active-pinned-node';
import { updateSelectedNodes } from 'src/stores/view/subscriptions/actions/update-selected-nodes';
import { loadPinnedNodesToDocument } from 'src/stores/view/subscriptions/actions/load-pinned-nodes-to-document';
import { updateSearchResults } from 'src/stores/view/subscriptions/actions/update-search-results';
import {
    createSectionColorIndex,
    serializeSectionColorMapForSettings,
    swapSectionColors,
} from 'src/view/helpers/mandala/section-colors';
import { getCurrentFileSectionColorMap } from 'src/lib/mandala/current-file-mandala-settings';

const createSaveOptions = (
    view: MandalaView,
    action: DocumentStoreAction,
): { mode: 'content-only' | 'structural'; changedSections?: string[] } => {
    if (action.type === 'document/update-node-content') {
        const sectionId = view.documentStore.getValue().sections.id_section[
            action.payload.nodeId
        ];
        if (sectionId) {
            return {
                mode: 'content-only',
                changedSections: [sectionId],
            };
        }
    }
    if (action.type === 'document/update-multiple-node-content') {
        const sections = action.payload.updates
            .map((update) => view.documentStore.getValue().sections.id_section[update.nodeId])
            .filter((section): section is string => Boolean(section));
        if (sections.length > 0) {
            return {
                mode: 'content-only',
                changedSections: sections,
            };
        }
    }
    if (action.type === 'document/mandala/swap') {
        const sourceSection = view.documentStore.getValue().sections.id_section[
            action.payload.sourceNodeId
        ];
        const targetSection = view.documentStore.getValue().sections.id_section[
            action.payload.targetNodeId
        ];
        return {
            mode: 'content-only',
            changedSections: [
                sourceSection ?? '',
                targetSection ?? '',
            ].filter(Boolean),
        };
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

    const e = getDocumentEventType(type);
    view.documentSearch.applyDocumentAction(action, documentState);
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

    // effects
    if (e.content) {
        view.alignBranch.align(action);
    }

    if (!container || !view.isViewOfFile) return;

    if (e.content || structuralChange) {
        void view.saveDocument(createSaveOptions(view, action));
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
