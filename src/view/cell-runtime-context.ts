import type { Readable } from 'svelte/store';
import { contentStore } from 'src/mandala-display/stores/document-derived-stores';
import { handleLinks } from 'src/mandala-cell/viewmodel/content-event-handlers/handle-links/handle-links';
import { isGrabbing } from 'src/mandala-cell/viewmodel/content-event-handlers/helpers/is-grabbing';
import {
    enableSidebarEditorForNode,
    openSidebarAndEditMandalaNode,
    setActiveMandalaNode,
} from 'src/mandala-interaction/helpers/node-editing';
import { openNodeEditor } from 'src/mandala-interaction/helpers/open-node-editor';
import { ShowHiddenCardInfoStore } from 'src/mandala-settings/state/derived/view-settings-store';
import { ShowMandalaDetailSidebarStore } from 'src/mandala-settings/state/derived/view-settings-store';
import { derived } from 'src/shared/store/derived';
import { setActiveSidebarNode } from 'src/stores/view/subscriptions/actions/set-active-sidebar-node';
import { localFontStore } from 'src/stores/local-font-store';
import type { MandalaSwapInteractionState } from 'src/mandala-interaction/helpers/mandala-swap';
import { markdownPreviewAction } from 'src/view/actions/markdown-preview/markdown-preview-action';
import { isMacLike } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/mod-key';
import type { MandalaView } from 'src/view/view';

export type PreviewDialogSnapshot = {
    open: boolean;
    nodeId: string | null;
};

export type CellRuntimeContext = {
    view: MandalaView;
    showDetailSidebar: Readable<boolean>;
    showHiddenCardInfo: Readable<boolean>;
    swapState: Readable<MandalaSwapInteractionState>;
    previewDialog: Readable<PreviewDialogSnapshot>;
    idToSection: Readable<Record<string, string>>;
    localFontSize: typeof localFontStore;
    contentForNode: (nodeId: string) => Readable<string>;
    activateMainSplitNode: (nodeId: string, event: MouseEvent) => void;
    activatePinnedSidebarNode: (nodeId: string) => void;
    activateMandalaNode: (nodeId: string, silent?: boolean) => void;
    enableMainSplitEdit: (nodeId: string) => void;
    enablePinnedSidebarEdit: (nodeId: string) => void;
    enableDetailSidebarEdit: (nodeId: string) => void;
    openSidebarAndEditNode: (nodeId: string) => void;
    handleLinks: (event: MouseEvent) => void;
    isGrabbing: () => boolean;
    setInlineCursor: (
        nodeId: string,
        cursor: { line: number; ch: number },
    ) => void;
    markdownPreviewAction: typeof markdownPreviewAction;
};

export const createCellRuntimeContext = (
    view: MandalaView,
): CellRuntimeContext => {
    const activateMainSplitNode = (nodeId: string, event: MouseEvent) => {
        const silent = isMacLike ? event.metaKey : event.ctrlKey;
        const previousNodeId = view.viewStore.getValue().document.activeNode;
        if (previousNodeId && previousNodeId !== nodeId) {
            const startedAt = performance.now();
            view.recordPerfAfterNextPaint(
                'interaction.active-node.mouse',
                startedAt,
                {
                    action_type: silent
                        ? 'view/set-active-node/mouse-silent'
                        : 'view/set-active-node/mouse',
                    from_node_id: previousNodeId,
                    to_node_id: nodeId,
                    silent,
                },
            );
        }
        view.viewStore.dispatch({
            type: silent
                ? 'view/set-active-node/mouse-silent'
                : 'view/set-active-node/mouse',
            payload: { id: nodeId },
        });
    };

    const enableMainSplitEdit = (nodeId: string) => {
        const editing = view.viewStore.getValue().document.editing;
        if (
            editing.activeNodeId === nodeId &&
            !editing.isInSidebar
        ) {
            return;
        }
        openNodeEditor(view, nodeId, {
            desktopIsInSidebar: view.isMandalaDetailSidebarVisible(),
        });
    };

    const enablePinnedSidebarEdit = (nodeId: string) => {
        view.viewStore.dispatch({
            type: 'view/editor/enable-sidebar-editor',
            payload: { id: nodeId },
            context: {
                activeSidebarTab: 'pinned-cards',
            },
        });
    };

    return {
        view,
        showDetailSidebar: ShowMandalaDetailSidebarStore(view),
        showHiddenCardInfo: ShowHiddenCardInfoStore(view),
        swapState: derived(view.viewStore, (state) => state.ui.mandala.swap),
        previewDialog: derived(view.viewStore, (state) => state.ui.previewDialog),
        idToSection: derived(
            view.documentStore,
            (state) => state.sections.id_section,
        ),
        localFontSize: localFontStore,
        contentForNode: (nodeId: string) => contentStore(view, nodeId),
        activateMainSplitNode,
        activatePinnedSidebarNode: (nodeId: string) =>
            setActiveSidebarNode(view, nodeId),
        activateMandalaNode: (nodeId: string, silent = false) =>
            setActiveMandalaNode(view, nodeId, silent),
        enableMainSplitEdit,
        enablePinnedSidebarEdit,
        enableDetailSidebarEdit: (nodeId: string) =>
            enableSidebarEditorForNode(view, nodeId),
        openSidebarAndEditNode: (nodeId: string) =>
            openSidebarAndEditMandalaNode(view, nodeId),
        handleLinks: (event: MouseEvent) => handleLinks(view, event),
        isGrabbing: () => isGrabbing(view),
        setInlineCursor: (
            nodeId: string,
            cursor: { line: number; ch: number },
        ) => {
            view.inlineEditor.setNodeCursor(nodeId, cursor);
        },
        markdownPreviewAction,
    };
};
