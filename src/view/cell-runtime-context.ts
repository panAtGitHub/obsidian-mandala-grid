import { MarkdownView } from 'obsidian';
import type { Readable } from 'svelte/store';
import { contentStore } from 'src/mandala-display/stores/document-derived-stores';
import {
    enableSidebarEditorForNode,
    openSidebarAndEditMandalaNode,
    setActiveMandalaNode,
} from 'src/mandala-interaction/helpers/node-editing';
import { executeMandalaSwap } from 'src/mandala-interaction/helpers/mandala-swap';
import { openNodeEditor } from 'src/mandala-interaction/helpers/open-node-editor';
import { ShowHiddenCardInfoStore } from 'src/mandala-settings/state/derived/view-settings-store';
import { ShowMandalaDetailSidebarStore } from 'src/mandala-settings/state/derived/view-settings-store';
import { derived } from 'src/shared/store/derived';
import { setActiveSidebarNode } from 'src/stores/view/subscriptions/actions/set-active-sidebar-node';
import { localFontStore } from 'src/stores/local-font-store';
import type { MandalaSwapInteractionState } from 'src/mandala-interaction/helpers/mandala-swap';
import { createExpandableTextareaAction } from 'src/view/actions/inline-editor/expandable-textarea-action';
import { createLoadInlineEditorAction } from 'src/view/actions/inline-editor/load-inline-editor';
import { createViewMarkdownPreviewAction } from 'src/view/actions/markdown-preview/markdown-preview-action';
import { isMacLike } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/mod-key';
import { handleLinks } from 'src/view/helpers/handle-links/handle-links';
import { isGrabbing } from 'src/view/helpers/is-grabbing';
import type { MandalaView } from 'src/view/view';
import {
    enterSubgridForNode,
    exitCurrentSubgrid,
    isGridCenter,
} from 'src/mandala-interaction/helpers/mobile-navigation';
import type { InlineMarkdownView } from 'src/obsidian/helpers/inline-editor/inline-editor';

export type PreviewDialogSnapshot = {
    open: boolean;
    nodeId: string | null;
};

type NodeAction = (
    element: HTMLElement,
    value: string,
) =>
    | void
    | {
          update?: (value: string) => void;
          destroy?: () => void;
      };

type BooleanAction = (
    element: HTMLElement,
    value?: boolean,
) =>
    | void
    | {
          update?: (value: boolean) => void;
          destroy?: () => void;
      };

export type CellRuntimeContext = {
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
    executeSwap: (sourceNodeId: string, targetNodeId: string) => void;
    handleLinks: (event: MouseEvent) => void;
    isGrabbing: () => boolean;
    isMobileGridCenter: (nodeId: string, displaySection: string) => boolean;
    enterMobileSubgrid: (nodeId: string) => void;
    exitMobileSubgrid: () => void;
    createReadonlySourcePreviewView: (
        hostEl: HTMLElement,
    ) => Promise<InlineMarkdownView | null>;
    setInlineCursor: (
        nodeId: string,
        cursor: { line: number; ch: number },
    ) => void;
    loadInlineEditorAction: NodeAction;
    expandableTextareaAction: BooleanAction;
    markdownPreviewAction: NodeAction;
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

    const createReadonlySourcePreviewView = async (
        hostEl: HTMLElement,
    ): Promise<InlineMarkdownView | null> => {
        const file = view.file;
        if (!file) return null;

        const markdownView = new MarkdownView({
            containerEl: hostEl,
            app: view.plugin.app,
            workspace: view.plugin.app.workspace,
            history: {
                backHistory: [],
                forwardHistory: [],
            },
        } as never) as InlineMarkdownView;

        const boundSetViewData = markdownView.setViewData.bind(markdownView);
        markdownView.mandalaSetViewData = boundSetViewData;
        markdownView.setViewData = function (
            this: void,
            _data: string,
            _clear: boolean,
        ): void {};

        if (markdownView.getMode() === 'preview') {
            await markdownView.setState({ mode: 'source' }, { history: false });
        }

        markdownView.file = file;
        await markdownView.onLoadFile(file);
        return markdownView;
    };

    return {
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
        executeSwap: (sourceNodeId: string, targetNodeId: string) =>
            executeMandalaSwap(view, sourceNodeId, targetNodeId),
        handleLinks: (event: MouseEvent) => handleLinks(view, event),
        isGrabbing: () => isGrabbing(view),
        isMobileGridCenter: (nodeId: string, displaySection: string) =>
            isGridCenter(view, nodeId, displaySection),
        enterMobileSubgrid: (nodeId: string) =>
            enterSubgridForNode(view, nodeId),
        exitMobileSubgrid: () => exitCurrentSubgrid(view),
        createReadonlySourcePreviewView,
        setInlineCursor: (
            nodeId: string,
            cursor: { line: number; ch: number },
        ) => {
            view.inlineEditor.setNodeCursor(nodeId, cursor);
        },
        loadInlineEditorAction: createLoadInlineEditorAction({
            hasActiveFile: () => Boolean(view.file),
            loadNode: (target: HTMLElement, nodeId: string) =>
                view.inlineEditor.loadNode(target, nodeId),
            unloadNode: (nodeId?: string, discardChanges?: boolean) =>
                view.inlineEditor.unloadNode(nodeId, discardChanges),
        }),
        expandableTextareaAction: createExpandableTextareaAction({
            shouldLimitCardHeight: () => {
                return Boolean(
                    view.plugin.settings
                        .getValue()
                        .view.limitPreviewHeight,
                );
            },
            isEditingInSidebar: () =>
                view.viewStore.getValue().document.editing.isInSidebar,
            revealNode: () => {
                view.alignBranch.align({
                    type: 'view/align-branch/reveal-node',
                });
            },
        }),
        markdownPreviewAction: createViewMarkdownPreviewAction(view),
    };
};
