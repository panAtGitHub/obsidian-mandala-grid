<script lang="ts">
    import clx from 'classnames';
    import { ActiveStatus } from 'src/view/components/container/column/components/group/components/active-status.enum';
    import Content from 'src/view/components/container/column/components/group/components/card/components/content/content.svelte';
    import InlineEditor from 'src/view/components/container/column/components/group/components/card/components/content/inline-editor.svelte';
    import Draggable from 'src/view/components/container/column/components/group/components/card/components/dnd/draggable.svelte';
    import CardStyle from 'src/view/components/container/column/components/group/components/card/components/card-style.svelte';
    import { droppable } from 'src/view/actions/dnd/droppable';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';
    import { getView } from 'src/view/components/container/context';
    import { setActiveMainSplitNode } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/set-active-main-split-node';
    import { enableEditModeInMainSplit } from 'src/view/components/container/column/components/group/components/card/components/content/store-actions/enable-edit-mode-in-main-split';
    import { Platform } from 'obsidian';
    import { 
        enterSubgridForNode, 
        exitCurrentSubgrid, 
        isGridCenter 
    } from 'src/view/helpers/mandala/mobile-navigation';
    import { executeMandalaSwap } from 'src/view/helpers/mandala/mandala-swap';
    import { setActiveCell9x9 } from 'src/view/helpers/mandala/set-active-cell-9x9';
    import { 
        ShowMandalaDetailSidebarStore,
        // AlwaysShowCardButtons,
        OutlineModeStore
    } from 'src/stores/settings/derived/view-settings-store';
    // import CardButtons from 'src/view/components/container/column/components/group/components/card/components/card-buttons/card-buttons/card-buttons.svelte';
    import { derived } from 'src/lib/store/derived';
    import { localFontStore } from 'src/stores/local-font-store';

    // 缓存平台状态，避免每次渲染都读取
    const isMobile = Platform.isMobile;

    export let nodeId: string;
    export let section: string;
    export let active: boolean;
    export let editing: boolean;
    export let selected: boolean;
    export let pinned: boolean;
    export let style: NodeStyle | undefined;
    export let sectionColor: string | null = null;
    export let draggable: boolean;
    export let gridCell: { mode: '9x9'; row: number; col: number } | null = null;

    const view = getView();
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    // const alwaysShowCardButtons = AlwaysShowCardButtons(view);
    const outlineMode = OutlineModeStore(view);
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);

    const hasChildrenStore = derived(view.documentStore, (state) => {
        const section = state.sections.id_section[nodeId];
        if (!section) return false;
        return Object.keys(state.sections.section_id).some((s) =>
            s.startsWith(section + '.'),
        );
    });

    const collapsedStore = derived(view.viewStore, (state) =>
        state.outline.collapsedParents.has(nodeId),
    );

    const handleSelect = (e: MouseEvent) => {
        if (gridCell) {
            setActiveCell9x9(view, null);
        }
        setActiveMainSplitNode(view, nodeId, e);
        
        // 移动端：绝对禁止触发编辑逻辑（编辑由右侧栏双击触发）
        if (isMobile) {
            return;
        }

        const maintainEditMode = view.plugin.settings.getValue().view.maintainEditMode;
        if (maintainEditMode && $showDetailSidebar) {
            view.viewStore.dispatch({
                type: 'view/editor/enable-main-editor',
                payload: { nodeId: nodeId, isInSidebar: true },
            });
        }
    };

    const handleCancel = () => {
        // 关闭编辑模式，内容将自动保存
        view.inlineEditor.unloadNode(nodeId, false);
        view.viewStore.dispatch({
            type: 'view/editor/disable-main-editor',
        });
    };

    const handleSave = () => {
        // 触发卸载并自动保存
        handleCancel();
    };

    // 防抖定时器
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    // 设置面板显示状态
    let showSettings = false;
    const toggleSettings = () => {
        showSettings = !showSettings;
    };

    const handleIncreaseFontSize = () => {
        localFontStore.setFontSize($localFontStore + 1);
    };

    const handleDecreaseFontSize = () => {
        localFontStore.setFontSize($localFontStore - 1);
    };

    const handleCardClick = (e: MouseEvent) => {
        if ($swapState.active) {
            const sourceNodeId = $swapState.sourceNodeId;
            if (sourceNodeId && $swapState.targetNodeIds.has(nodeId)) {
                executeMandalaSwap(view, sourceNodeId, nodeId);
            }
            return;
        }

        handleSelect(e);
    };
</script>

<div
    class={clx(
        'mandala-card',
        active ? 'active-node' : 'inactive-node',
        selected ? 'node-border--selected' : undefined,
        pinned ? 'node-border--pinned' : undefined,
        active ? 'node-border--active' : undefined,
        // $alwaysShowCardButtons ? 'always-show-buttons' : undefined,
    )}
    class:mandala-card--swap-source={$swapState.active && $swapState.sourceNodeId === nodeId}
    class:mandala-card--swap-target={$swapState.active && $swapState.targetNodeIds.has(nodeId)}
    class:mandala-card--swap-disabled={$swapState.active && !$swapState.targetNodeIds.has(nodeId) && $swapState.sourceNodeId !== nodeId}
    class:is-floating-mobile={isMobile && editing && !$showDetailSidebar}
    id={nodeId}
    style={sectionColor ? `background-color: ${sectionColor};` : undefined}
    use:droppable
    on:click={handleCardClick}
    on:dblclick={(e) => {
        if ($swapState.active) return;

        // 移动端：双击仅用于导航（进入/退出子九宫）
        if (isMobile) {
            if (isGridCenter(view, nodeId, section)) {
                exitCurrentSubgrid(view);
            } else {
                enterSubgridForNode(view, nodeId);
            }
            return;
        }

        handleSelect(e);

        // PC 端逻辑：根据侧栏状态决定编辑位置
        if ($showDetailSidebar) {
            view.viewStore.dispatch({
                type: 'view/editor/enable-main-editor',
                payload: { nodeId: nodeId, isInSidebar: true },
            });
        } else {
            enableEditModeInMainSplit(view, nodeId);
        }
    }}
>
    {#if style && !(sectionColor && style.styleVariant === 'background-color')}
        <CardStyle {style} />
    {/if}

    {#if active && editing && !$showDetailSidebar}
        <InlineEditor 
            nodeId={nodeId} 
            {style} 
            fontSizeOffset={isMobile ? ($localFontStore - 16) : 0} 
            absoluteFontSize={isMobile ? $localFontStore : undefined}
        />
    {:else if draggable}
        <Draggable nodeId={nodeId} isInSidebar={false}>
            <Content nodeId={nodeId} isInSidebar={false} active={active ? ActiveStatus.node : null} />
        </Draggable>
    {:else}
        <Content nodeId={nodeId} isInSidebar={false} active={active ? ActiveStatus.node : null} />
    {/if}
    
    <!-- <CardButtons
        {editing}
        {nodeId}
        hasChildren={$hasChildrenStore}
        isInSidebar={false}
        collapsed={$collapsedStore}
        active={active ? ActiveStatus.node : null}
        alwaysShowCardButtons={$alwaysShowCardButtons}
        outlineMode={$outlineMode}
    /> -->

    <div class="mandala-section-label">{section}</div>
</div>

<style>
    .mandala-card {
        width: var(--mandala-card-width, var(--node-width));
        min-height: var(--mandala-card-min-height, var(--min-node-height));
        height: var(--mandala-card-height, fit-content);
        display: flex;
        flex-direction: column;
        position: relative;
        --font-text-size: var(--mandala-font-3x3, 16px);
        font-size: var(--font-text-size, 16px);
        line-height: 1.4;
        overflow: var(--mandala-card-overflow, visible);
        background-color: var(--background-primary);
        --scrollbar-thumb-bg: var(--color-base-30);
        --scrollbar-active-thumb-bg: var(--color-base-40);
    }

    :global(.mandala-view:not(.mandala-white-theme)) .mandala-card:hover {
        z-index: 10;
    }

    .mandala-section-label {
        position: absolute;
        top: 6px;
        right: 8px;
        font-size: 12px;
        opacity: 0.7;
        user-select: none;
        pointer-events: none;
    }

    .mandala-card--swap-source {
        box-shadow: 0 0 0 2px var(--interactive-accent);
    }

    .mandala-card--swap-target {
        box-shadow: 0 0 0 2px var(--interactive-accent);
        cursor: pointer;
    }

    .mandala-card--swap-disabled {
        opacity: 0.6;
    }


    /* .mandala-card.always-show-buttons :global(.mandala-floating-button) {
        opacity: var(--opacity-inactive-node) !important;
    }

    .mandala-card.always-show-buttons.active-node :global(.mandala-floating-button) {
        opacity: var(--opacity-active-node) !important;
    } */

    /* 悬浮模式下的内容区优化 (目前统一由顶层逻辑处理) */
</style>
