<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { derived } from 'src/lib/store/derived';
    import {
        ShowMandalaDetailSidebarStore,
        MandalaDetailSidebarWidthStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { onDestroy, tick } from 'svelte';
    import InlineEditor from 'src/view/components/container/column/components/group/components/card/components/content/inline-editor.svelte';
    import Content from 'src/view/components/container/column/components/group/components/card/components/content/content.svelte';
    import { NodeStylesStore } from 'src/stores/view/derived/style-rules';
    import { ActiveStatus } from '../container/column/components/group/components/active-status.enum';

    const MIN_WIDTH = 250;
    // 用于 CSS transition 动画的宽度，可以为 0
    let animatedSidebarWidth = 0;
    // 实际宽度值，不为 0
    let sidebarWidth = MIN_WIDTH;
    let isResizing = false;
    let startX = 0;

    const view = getView();
    const showSidebarStore = ShowMandalaDetailSidebarStore(view);
    const savedWidthStore = MandalaDetailSidebarWidthStore(view);
    const editingState = derived(view.viewStore, (state) => state.document.editing);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const styleRules = NodeStylesStore(view);

    let editorContainer: HTMLElement;

    $: isEditingInSidebar =
        $editingState.activeNodeId === $activeNodeId &&
        $editingState.isInSidebar;

    const focusEditor = async () => {
        await tick();
        if (editorContainer) {
            const editor = editorContainer.querySelector(
                '.common-editor',
            ) as HTMLTextAreaElement | HTMLDivElement;
            if (editor) {
                editor.focus();
            }
        }
    };

    // 自动聚焦逻辑
    $: if (isEditingInSidebar) {
        focusEditor();
    } else if (!$editingState.activeNodeId) {
        // 当退出编辑时，尝试将焦点还给网格根容器，确保方向键继续工作
        tick().then(() => {
            const root = view.contentEl.querySelector('.mandala-scroll') as HTMLElement;
            if (root) root.focus();
        });
    }

    const unsub = showSidebarStore.subscribe((show) => {
        if (show) {
            animatedSidebarWidth = view.plugin.settings.getValue().view.mandalaDetailSidebarWidth;
            sidebarWidth = animatedSidebarWidth;
        } else {
            animatedSidebarWidth = 0;
        }
    });

    onDestroy(() => {
        unsub();
    });

    // 处理缩放逻辑
    const onStartResize = (event: MouseEvent) => {
        isResizing = true;
        startX = event.clientX;
        view.contentEl.addEventListener('mousemove', onResize);
        view.contentEl.addEventListener('mouseup', onStopResize);
    };

    const onResize = (event: MouseEvent) => {
        if (!isResizing) return;
        // 侧边栏在右侧，向左拖动是增加宽度，向右是减少
        const dx = startX - event.clientX;
        animatedSidebarWidth += dx;
        startX = event.clientX;
        if (animatedSidebarWidth > MIN_WIDTH) {
            sidebarWidth = animatedSidebarWidth;
        }
    };

    const onStopResize = () => {
        isResizing = false;
        view.contentEl.removeEventListener('mousemove', onResize);
        view.contentEl.removeEventListener('mouseup', onStopResize);

        if (animatedSidebarWidth < MIN_WIDTH) {
            animatedSidebarWidth = MIN_WIDTH;
        }
        sidebarWidth = animatedSidebarWidth;
        view.plugin.settings.dispatch({
            type: 'view/mandala-detail-sidebar/set-width',
            payload: {
                width: animatedSidebarWidth,
            },
        });
    };
</script>

<div
    class={'mandala-detail-sidebar' + (isResizing ? '' : ' width-transition')}
    style="--animated-sidebar-width: {animatedSidebarWidth}px; --sidebar-width: {sidebarWidth}px;"
>
    <div class="resizer" on:mousedown={onStartResize} />
    {#if animatedSidebarWidth > 50}
        <div class="sidebar-content">
            {#if $activeNodeId}
                <div class="editor-wrapper">
                    {#key $activeNodeId}
                        {#if isEditingInSidebar}
                            <div bind:this={editorContainer} class="sidebar-editor-container">
                                <InlineEditor
                                    nodeId={$activeNodeId}
                                    style={$styleRules.get($activeNodeId)}
                                />
                            </div>
                        {:else}
                            <Content
                                nodeId={$activeNodeId}
                                isInSidebar={false}
                                active={null}
                            />
                        {/if}
                    {/key}
                </div>
            {:else}
                <div class="no-selection">请选择一个格子进行编辑</div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .mandala-detail-sidebar {
        flex: 0 0 auto;
        width: var(--animated-sidebar-width);
        position: relative;
        overflow: hidden;
        background-color: var(--background-primary);
        border-left: 1px solid var(--background-modifier-border);
        display: flex;
        flex-direction: column;
    }

    .width-transition {
        transition: width 0.3s ease;
    }

    .resizer {
        position: absolute;
        top: 0;
        height: 100%;
        bottom: 0;
        background-color: transparent;
        transition: background-color 0.2s;
        cursor: col-resize;
        left: 0px;
        width: 4px;
        z-index: 10;
    }

    .resizer:hover {
        background-color: var(--color-accent);
    }

    .sidebar-content {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        min-width: var(--sidebar-width);
        padding: 16px;
        overflow-y: auto;
    }

    .editor-wrapper {
        flex: 1;
    }

    .no-selection {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-style: italic;
    }

    /* 适配 InlineEditor 在侧边栏的样式 */
    :global(.mandala-detail-sidebar .editor-container) {
        height: 100% !important;
        min-height: 400px;
    }

    :global(.mandala-detail-sidebar .view-content) {
        background-color: var(--background-primary) !important;
        padding: 0 !important;
    }
</style>
