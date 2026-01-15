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
    import { mobileInteractionMode } from 'src/stores/view/mobile-interaction-store';
    import { 
        enterSubgridForNode, 
        exitCurrentSubgrid, 
        isGridCenter 
    } from 'src/view/helpers/mandala/mobile-navigation';
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
    export let draggable: boolean;
    export let gridCell: { mode: '9x9'; row: number; col: number } | null = null;

    const view = getView();
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    // const alwaysShowCardButtons = AlwaysShowCardButtons(view);
    const outlineMode = OutlineModeStore(view);

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
            view.mandalaActiveCell9x9 = { row: gridCell.row, col: gridCell.col };
        }
        setActiveMainSplitNode(view, nodeId, e);
        
        // 移动端锁定模式下，绝对禁止触发编辑逻辑
        if (Platform.isMobile && $mobileInteractionMode === 'locked') {
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
    class:is-floating-mobile={isMobile && editing && !$showDetailSidebar}
    id={nodeId}
    use:droppable
    on:click={handleSelect}
    on:dblclick={(e) => {
        if (isMobile && $mobileInteractionMode === 'locked') {
            // 锁定模式下，使用静默选择并执行导航
            view.viewStore.dispatch({
                type: 'view/set-active-node/mouse-silent',
                payload: { id: nodeId },
            });
            if (isGridCenter(view, nodeId, section)) {
                exitCurrentSubgrid(view);
            } else {
                enterSubgridForNode(view, nodeId);
            }
            return;
        }

        handleSelect(e);
        
        if (isMobile && $mobileInteractionMode === 'unlocked') {
            // 解锁模式下双击：强制进入全屏 Popup (场景 3, 4, 7, 8)
            view.viewStore.dispatch({
                type: 'view/editor/enable-main-editor',
                payload: { nodeId: nodeId, isInSidebar: false },
            });
            return;
        }

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
    {#if style}
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
        font-size: var(--font-text-size, 16px);
        line-height: 1.4;
        overflow: var(--mandala-card-overflow, visible);
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


    /* .mandala-card.always-show-buttons :global(.mandala-floating-button) {
        opacity: var(--opacity-inactive-node) !important;
    }

    .mandala-card.always-show-buttons.active-node :global(.mandala-floating-button) {
        opacity: var(--opacity-active-node) !important;
    } */

    /* 悬浮模式下的内容区优化 (目前统一由顶层逻辑处理) */
</style>
