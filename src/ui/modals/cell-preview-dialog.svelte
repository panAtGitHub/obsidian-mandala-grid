<script lang="ts">
    import { Platform } from 'obsidian';
    import { tick } from 'svelte';
    import { derived } from 'src/lib/store/derived';
    import {
        MandalaCellPreviewFontSizeDesktopStore,
        MandalaCellPreviewFontSizeMobileStore,
        ShowCellQuickPreviewDialogStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { markdownPreviewAction } from 'src/view/actions/markdown-preview/markdown-preview-action';
    import InlineEditor from 'src/cell/view/content/inline-editor.svelte';
    import { getView } from 'src/views/shared/shell/context';
    import Portal from 'src/ui/shared/portal.svelte';
    import {
        closeCellPreviewDialog,
        openCellPreviewDialog,
    } from 'src/helpers/views/mandala/cell-preview-dialog';
    import { isPreviewDialogEditingNode } from 'src/helpers/views/mandala/is-preview-dialog-editing-node';
    import { openNodeEditor } from 'src/helpers/views/mandala/open-node-editor';
    import { resolveCellPreviewNodeId } from 'src/view/helpers/mandala/resolve-cell-preview-node-id';

    const view = getView();
    const previewDialog = derived(
        view.viewStore,
        (state) => state.ui.previewDialog,
    );
    const cellQuickPreviewEnabled = ShowCellQuickPreviewDialogStore(view);
    const cellPreviewFontSize = Platform.isMobile
        ? MandalaCellPreviewFontSizeMobileStore(view)
        : MandalaCellPreviewFontSizeDesktopStore(view);
    const viewState = derived(view.viewStore, (state) => state);
    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );

    let dialogEl: HTMLDivElement | null = null;
    let previewNodeId: string | null = null;
    let sectionLabel = '';

    $: resolvedReadonlyNodeId = !$editingState.activeNodeId
        ? resolveCellPreviewNodeId({
              mode: view.mandalaMode,
              activeNodeId: $viewState.document.activeNode,
              activeNodeSection:
                  $idToSection[$viewState.document.activeNode] ?? null,
              activeCell9x9: $viewState.ui.mandala.activeCell9x9,
              activeCellNx9: $viewState.ui.mandala.activeCellNx9,
              activeCellWeek7x9: $viewState.ui.mandala.activeCellWeek7x9,
              sectionIdMap: view.documentStore.getValue().sections.section_id,
              documentContent: view.documentStore.getValue().document.content,
              nx9RowsPerPage: view.getCurrentNx9RowsPerPage(),
              selectedLayoutId: view.getCurrentMandalaLayoutId(),
              customLayouts:
                  view.plugin.settings.getValue().view
                      .mandalaGridCustomLayouts ?? [],
              frontmatter: view.documentStore.getValue().file.frontmatter,
              weekAnchorDate: $viewState.ui.mandala.weekAnchorDate,
              weekStart: view.plugin.settings.getValue().general.weekStart,
          })
        : null;
    $: if (
        $previewDialog.open &&
        $cellQuickPreviewEnabled &&
        !$editingState.activeNodeId &&
        resolvedReadonlyNodeId &&
        resolvedReadonlyNodeId !== $previewDialog.nodeId
    ) {
        openCellPreviewDialog(view, resolvedReadonlyNodeId);
    }
    $: previewNodeId = resolvedReadonlyNodeId ?? $previewDialog.nodeId;
    $: sectionLabel = previewNodeId ? $idToSection[previewNodeId] ?? '' : '';
    $: if (
        !$cellQuickPreviewEnabled &&
        $previewDialog.open &&
        !$editingState.activeNodeId
    ) {
        closeCellPreviewDialog(view);
    }
    $: isOpen =
        !Platform.isMobile &&
        $cellQuickPreviewEnabled &&
        $previewDialog.open &&
        !!previewNodeId;
    $: isEditingPreview = isPreviewDialogEditingNode({
        previewDialogOpen: isOpen,
        previewDialogNodeId: $previewDialog.nodeId,
        editingActiveNodeId: $editingState.activeNodeId,
        editingIsInSidebar: $editingState.isInSidebar,
        nodeId: previewNodeId,
    });

    const focusDialog = async () => {
        await tick();
        dialogEl?.focus();
    };

    const focusInlineEditor = async () => {
        await tick();
        const editor = dialogEl?.querySelector('.common-editor') as
            | HTMLTextAreaElement
            | HTMLDivElement
            | null;
        editor?.focus();
    };

    $: if (isOpen) {
        if (isEditingPreview) {
            void focusInlineEditor();
        } else {
            void focusDialog();
        }
    }

    const startEditing = () => {
        if (!previewNodeId) return;
        openCellPreviewDialog(view, previewNodeId);
        openNodeEditor(view, previewNodeId, {
            desktopIsInSidebar: false,
        });
    };

    const close = () => {
        closeCellPreviewDialog(view);
    };
    const getPortalTarget = () =>
        view.contentEl.querySelector('.mandala-main') as HTMLElement | null;

    const handleReadonlyKeydown = (event: KeyboardEvent) => {
        if (isEditingPreview) return;

        const handled =
            event.key === 'Escape' ||
            event.key === 'Enter' ||
            event.key === ' ' ||
            event.key === 'Tab';
        if (!handled) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'Escape' || event.key === ' ') {
            close();
            return;
        }
        if (event.key === 'Enter') {
            startEditing();
        }
    };
</script>

{#if isOpen && previewNodeId}
    <Portal target={getPortalTarget()}>
        <div class="cell-preview-dialog__layer">
            <div
                class="cell-preview-dialog"
                on:mousedown|stopPropagation
                on:click|stopPropagation
            >
                <div class="cell-preview-dialog__header">
                    <div class="cell-preview-dialog__header-row">
                        <div class="cell-preview-dialog__eyebrow">
                            Quick Preview
                        </div>
                        <div class="cell-preview-dialog__title">
                            {sectionLabel || '未命名格子'}
                        </div>
                    </div>
                </div>
                <div
                    bind:this={dialogEl}
                    class="cell-preview-dialog__body"
                    class:is-editing={isEditingPreview}
                    data-cell-preview-dialog={isEditingPreview
                        ? 'editing'
                        : 'readonly'}
                    style={`--cell-preview-font-size: ${$cellPreviewFontSize}px;`}
                    tabindex="0"
                    on:keydown={handleReadonlyKeydown}
                >
                    {#if isEditingPreview}
                        <InlineEditor
                            nodeId={previewNodeId}
                            absoluteFontSize={$cellPreviewFontSize}
                            disableAutoResize={true}
                        />
                    {:else}
                        <div
                            class="cell-preview-dialog__preview markdown-preview-view markdown-rendered"
                            style={`font-size: ${$cellPreviewFontSize}px;`}
                            use:markdownPreviewAction={previewNodeId}
                        />
                    {/if}
                </div>
                <div class="cell-preview-dialog__footer">
                    {#if isEditingPreview}
                        继续使用当前编辑快捷键保存或退出编辑
                    {:else}
                        `Enter` 编辑，方向键切换格子，`Space` / `Esc` 关闭
                    {/if}
                </div>
            </div>
        </div>
    </Portal>
{/if}

<style>
    .cell-preview-dialog__layer {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px 28px;
        z-index: 1590;
        background: transparent;
    }

    .cell-preview-dialog {
        width: clamp(420px, 34vw, 660px);
        max-height: min(68vh, 780px);
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px 14px 10px;
        border-radius: 18px;
        border: 1px solid var(--background-modifier-border);
        background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--background-primary) 96%, white 4%),
            var(--background-primary)
        );
        box-shadow:
            0 18px 42px rgba(0, 0, 0, 0.16),
            0 6px 18px rgba(0, 0, 0, 0.1);
        z-index: 1600;
    }

    .cell-preview-dialog__header {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .cell-preview-dialog__header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 1em;
    }

    .cell-preview-dialog__eyebrow {
        font-size: 12px;
        line-height: 1;
        font-weight: 400;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: color-mix(in srgb, var(--text-muted) 72%, transparent);
        text-align: left;
    }

    .cell-preview-dialog__title {
        font-size: 12px;
        line-height: 1;
        font-weight: 700;
        color: var(--text-normal);
        text-align: right;
    }

    .cell-preview-dialog__body {
        min-height: min(340px, 40vh);
        height: min(60vh, 700px);
        overflow: hidden;
        border-radius: 14px;
        border: 1px solid var(--background-modifier-border);
        background: color-mix(
            in srgb,
            var(--background-secondary) 92%,
            transparent
        );
        padding: 18px 0;
        outline: none;
        display: flex;
    }

    .cell-preview-dialog__body.is-editing {
        padding: 0;
    }

    .cell-preview-dialog__preview {
        min-height: 100%;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        overflow: auto;
        scrollbar-gutter: stable both-edges;
        padding: 0 10px 0 22px;
        font-size: var(--cell-preview-font-size);
        line-height: 1.6;
        background: transparent;
    }

    .cell-preview-dialog__preview :global(:first-child) {
        margin-top: 0;
    }

    .cell-preview-dialog__preview :global(:last-child) {
        margin-bottom: 0;
    }

    .cell-preview-dialog__body.is-editing :global(.editor-container) {
        min-height: 100%;
        height: 100%;
        overflow: auto;
        box-sizing: border-box;
        padding: 18px 10px 18px 22px;
        scrollbar-gutter: stable both-edges;
        background: transparent;
    }

    .cell-preview-dialog__body.is-editing :global(.cm-editor),
    .cell-preview-dialog__body.is-editing :global(.cm-editor .cm-scroller) {
        min-height: 100%;
        height: 100%;
        background: transparent !important;
    }

    .cell-preview-dialog__body.is-editing :global(.cm-editor .cm-scroller) {
        overflow: auto !important;
    }

    .cell-preview-dialog__body.is-editing :global(.cm-content),
    .cell-preview-dialog__body.is-editing :global(.cm-gutters),
    .cell-preview-dialog__body.is-editing :global(.view-content),
    .cell-preview-dialog__body.is-editing :global(.cm-activeLine),
    .cell-preview-dialog__body.is-editing :global(.cm-activeLineGutter) {
        background: transparent !important;
    }

    .cell-preview-dialog__footer {
        font-size: 10px;
        color: color-mix(in srgb, var(--text-faint) 68%, transparent);
        line-height: 1.35;
    }
</style>
