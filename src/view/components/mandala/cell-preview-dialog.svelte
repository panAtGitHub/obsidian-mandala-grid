<script lang="ts">
    import { Platform } from 'obsidian';
    import { tick } from 'svelte';
    import { derived } from 'src/lib/store/derived';
    import { markdownPreviewAction } from 'src/view/actions/markdown-preview/markdown-preview-action';
    import InlineEditor from 'src/view/components/container/column/components/group/components/card/components/content/inline-editor.svelte';
    import { getView } from 'src/view/components/container/context';
    import Portal from 'src/view/components/container/shared/portal.svelte';
    import { closeCellPreviewDialog } from 'src/view/helpers/mandala/cell-preview-dialog';
    import { openNodeEditor } from 'src/view/helpers/mandala/open-node-editor';

    const view = getView();
    const previewDialog = derived(
        view.viewStore,
        (state) => state.ui.previewDialog,
    );
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

    $: previewNodeId = $previewDialog.nodeId;
    $: sectionLabel = previewNodeId ? $idToSection[previewNodeId] ?? '' : '';
    $: isOpen = !Platform.isMobile && $previewDialog.open && !!previewNodeId;
    $: isEditingPreview =
        isOpen &&
        $editingState.activeNodeId === previewNodeId &&
        !$editingState.isInSidebar;

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
        openNodeEditor(view, previewNodeId, {
            desktopIsInSidebar: false,
        });
    };

    const close = () => {
        closeCellPreviewDialog(view);
    };

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

    const closeFromOverlay = () => {
        if (isEditingPreview) return;
        close();
    };
</script>

{#if isOpen && previewNodeId}
    <Portal>
        <div class="cell-preview-dialog__overlay" on:click={closeFromOverlay} />
        <div
            class="cell-preview-dialog"
            on:mousedown|stopPropagation
            on:click|stopPropagation
        >
            <div class="cell-preview-dialog__header">
                <div class="cell-preview-dialog__eyebrow">Cell Preview</div>
                <div class="cell-preview-dialog__title">
                    {sectionLabel || '未命名格子'}
                </div>
            </div>
            <div
                bind:this={dialogEl}
                class="cell-preview-dialog__body"
                class:is-editing={isEditingPreview}
                data-cell-preview-dialog={isEditingPreview
                    ? 'editing'
                    : 'readonly'}
                tabindex="0"
                on:keydown={handleReadonlyKeydown}
            >
                {#if isEditingPreview}
                    <InlineEditor
                        nodeId={previewNodeId}
                        disableAutoResize={true}
                    />
                {:else}
                    <div
                        class="cell-preview-dialog__preview markdown-preview-view markdown-rendered"
                        use:markdownPreviewAction={previewNodeId}
                    />
                {/if}
            </div>
            <div class="cell-preview-dialog__footer">
                {#if isEditingPreview}
                    继续使用当前编辑快捷键保存或退出编辑
                {:else}
                    `Enter` 编辑，`Space` / `Esc` 关闭
                {/if}
            </div>
        </div>
    </Portal>
{/if}

<style>
    .cell-preview-dialog__overlay {
        position: fixed;
        inset: 0;
        z-index: 1590;
        background: rgba(9, 12, 18, 0.44);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    .cell-preview-dialog {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: min(900px, calc(100vw - 64px));
        max-height: min(80vh, 900px);
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 22px 22px 18px;
        border-radius: 22px;
        border: 1px solid
            color-mix(in srgb, var(--background-modifier-border) 86%, white 14%);
        background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--background-primary) 94%, white 6%),
            var(--background-primary)
        );
        box-shadow:
            0 32px 90px rgba(0, 0, 0, 0.28),
            0 12px 28px rgba(0, 0, 0, 0.18);
        z-index: 1600;
    }

    .cell-preview-dialog__header {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .cell-preview-dialog__eyebrow {
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-muted);
    }

    .cell-preview-dialog__title {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-normal);
        line-height: 1.2;
    }

    .cell-preview-dialog__body {
        min-height: min(420px, 50vh);
        max-height: min(58vh, 720px);
        overflow: auto;
        border-radius: 18px;
        border: 1px solid var(--background-modifier-border);
        background: color-mix(
            in srgb,
            var(--background-secondary) 92%,
            transparent
        );
        padding: 18px 20px;
        outline: none;
    }

    .cell-preview-dialog__body.is-editing {
        padding: 0;
        overflow: hidden;
    }

    .cell-preview-dialog__preview {
        min-height: 100%;
    }

    .cell-preview-dialog__preview :global(:first-child) {
        margin-top: 0;
    }

    .cell-preview-dialog__preview :global(:last-child) {
        margin-bottom: 0;
    }

    .cell-preview-dialog__body.is-editing :global(.editor-container) {
        min-height: min(420px, 50vh);
        height: min(58vh, 720px);
        overflow: auto;
    }

    .cell-preview-dialog__body.is-editing :global(.cm-editor),
    .cell-preview-dialog__body.is-editing :global(.cm-editor .cm-scroller) {
        min-height: min(420px, 50vh);
        height: min(58vh, 720px);
    }

    .cell-preview-dialog__body.is-editing :global(.cm-editor .cm-scroller) {
        overflow: auto !important;
    }

    .cell-preview-dialog__footer {
        font-size: 12px;
        color: var(--text-muted);
    }
</style>
