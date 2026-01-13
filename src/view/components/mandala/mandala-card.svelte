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

    // 使用 derived store 仅订阅需要的字段，避免过度渲染
    const fontSizeOffsetStore = derived(
        view.plugin.settings,
        (s) => s.view.mobileEditFontSizeOffset
    );

    // 防抖定时器
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    // 设置面板显示状态
    let showSettings = false;
    const toggleSettings = () => {
        showSettings = !showSettings;
    };

    const handleIncreaseFontSize = () => {
        const currentOffset = view.plugin.settings.getValue().view.mobileEditFontSizeOffset;
        const newOffset = currentOffset + 1;
        
        // 立即更新 UI
        fontSizeOffsetStore.set?.(newOffset);
        
        // 防抖延迟持久化
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            view.plugin.settings.dispatch({
                type: 'settings/view/set-mobile-edit-font-size-offset',
                payload: { offset: newOffset },
            });
        }, 300);
    };

    const handleDecreaseFontSize = () => {
        const currentOffset = view.plugin.settings.getValue().view.mobileEditFontSizeOffset;
        const newOffset = Math.max(-10, currentOffset - 1);
        
        fontSizeOffsetStore.set?.(newOffset);
        
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            view.plugin.settings.dispatch({
                type: 'settings/view/set-mobile-edit-font-size-offset',
                payload: { offset: newOffset },
            });
        }, 300);
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
    style="--local-font-size-offset: {$fontSizeOffsetStore}px"
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
        
        // 移动端和桌面端逻辑统一
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
        {#if isMobile}
            <div class="mobile-edit-header" on:click|stopPropagation>
                <button class="header-btn settings-btn" on:click|stopPropagation={toggleSettings}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>
                <button class="header-btn save-btn" on:click|stopPropagation={handleSave}>完成</button>
            </div>
            {#if showSettings}
                <div class="mobile-settings-panel" on:click|stopPropagation>
                    <div class="settings-row">
                        <span class="settings-label">字号</span>
                        <div class="font-size-controls">
                            <button class="control-btn" on:click|stopPropagation={handleDecreaseFontSize}>-</button>
                            <span class="font-value">{$fontSizeOffsetStore >= 0 ? '+' : ''}{$fontSizeOffsetStore}</span>
                            <button class="control-btn" on:click|stopPropagation={handleIncreaseFontSize}>+</button>
                        </div>
                    </div>
                </div>
            {/if}
        {/if}
        <InlineEditor nodeId={nodeId} {style} fontSizeOffset={isMobile ? $fontSizeOffsetStore : 0} />
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
        font-size: calc(var(--font-text-size, 16px) + var(--local-font-size-offset, 0px));
        overflow: var(--mandala-card-overflow, visible);
        --scrollbar-thumb-bg: var(--color-base-30);
        --scrollbar-active-thumb-bg: var(--color-base-40);
    }

    .mandala-card:hover {
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

    /* 移动端悬浮编辑模式：脱离九宫格约束 */
    :global(.is-mobile) .is-floating-mobile {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 1000 !important;
        background-color: var(--background-primary) !important;
        /* 增加顶部间距以避让药丸屏/刘海屏 */
        padding-top: calc(env(safe-area-inset-top, 20px) + 50px) !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow-y: auto !important;
    }

    /* 移动端编辑头部 */
    .mobile-edit-header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(env(safe-area-inset-top, 20px) + 50px);
        background-color: var(--background-primary);
        border-bottom: 1px solid var(--background-modifier-border);
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 0 16px 10px 16px;
        z-index: 1001;
    }


    .header-title {
        font-weight: 600;
        font-size: 17px;
        color: var(--text-normal);
        margin-bottom: 2px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    }

    .header-btn {
        background: none;
        border: none;
        padding: 0;
        font-size: 16px;
        cursor: pointer;
        box-shadow: none !important;
        color: var(--interactive-accent);
    }

    .save-btn {
        font-weight: 600;
    }

    .settings-btn {
        opacity: 0.7;
    }
    .settings-btn:active {
        opacity: 1;
    }

    /* 设置面板 */
    .mobile-settings-panel {
        position: fixed;
        top: calc(env(safe-area-inset-top, 20px) + 50px);
        left: 0;
        width: 100%;
        background: var(--background-secondary);
        border-bottom: 1px solid var(--background-modifier-border);
        padding: 12px 16px;
        z-index: 1001;
    }

    .settings-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .settings-label {
        font-size: 15px;
        color: var(--text-normal);
    }

    .font-size-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .control-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        font-size: 18px;
        color: var(--text-normal);
        cursor: pointer;
    }

    .font-value {
        min-width: 40px;
        text-align: center;
        font-size: 14px;
        color: var(--text-muted);
    }

    /* 悬浮模式下的内容区优化 */
    :global(.is-mobile) .is-floating-mobile :global(.lng-prev),
    :global(.is-mobile) .is-floating-mobile :global(.editor-container) {
        min-height: 50vh !important;
    }
</style>
