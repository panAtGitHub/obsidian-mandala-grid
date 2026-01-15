<script lang="ts">
    import { Platform } from 'obsidian';
    import { onDestroy, onMount } from 'svelte';
    import { derived } from 'src/lib/store/derived';
    import {
        MandalaDetailSidebarWidthStore,
        MandalaModeStore,
        ShowMandalaDetailSidebarStore,
        SquareLayoutStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { getView } from 'src/view/components/container/context';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import {
        childSlots,
        coreSlots,
        posOfSection9x9,
        sectionAtCell9x9,
    } from 'src/view/helpers/mandala/mandala-grid';
    import Mandala9x9Grid from 'src/view/components/mandala/mandala-9x9-grid.svelte';
    import MandalaOverviewSimple from 'src/view/components/mandala/mandala-overview-simple.svelte';
    import VerticalToolbar from 'src/view/components/container/toolbar-vertical/vertical-toolbar.svelte';
    import Toolbar from 'src/view/components/container/toolbar/toolbar.svelte';
    import MandalaDetailSidebar from './mandala-detail-sidebar.svelte';
    import { createLayoutStore } from 'src/stores/view/orientation-store';

    import InlineEditor from 'src/view/components/container/column/components/group/components/card/components/content/inline-editor.svelte';
    import { mobilePopupFontSizeStore } from 'src/stores/mobile-popup-font-store';

    const view = getView();
    const layout = createLayoutStore();

    // 默认九宫格大小（如果是移动端且开启该逻辑）
    $: squareSize = $layout.squareSize;
    $: isPortrait = $layout.isPortrait;

    const mode = MandalaModeStore(view);
    const toggleMode = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/toggle-mode',
        });
        focusContainer(view);
    };

    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const detailSidebarWidth = MandalaDetailSidebarWidthStore(view);
    const squareLayout = SquareLayoutStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);

    const MIN_DESKTOP_DETAIL_SIDEBAR_SIZE = 200;

    let desktopSquareSize = 0;
    let contentWrapperRef: HTMLElement | null = null;
    let contentWrapperObserver: ResizeObserver | null = null;

    const recomputeDesktopSquareSize = () => {
        if (Platform.isMobile || !$squareLayout || !contentWrapperRef) {
            desktopSquareSize = 0;
            return;
        }

        const rect = contentWrapperRef.getBoundingClientRect();
        const sidebarMinWidth = $showDetailSidebar
            ? Math.max(
                  MIN_DESKTOP_DETAIL_SIDEBAR_SIZE,
                  $detailSidebarWidth || MIN_DESKTOP_DETAIL_SIDEBAR_SIZE,
              )
            : 0;
        const availableWidth = Math.max(0, rect.width - sidebarMinWidth);
        desktopSquareSize = Math.floor(
            Math.max(0, Math.min(rect.height, availableWidth)),
        );
    };

    // 强制锁定为 3x3 模式以支持无限嵌套逻辑，保留 9x9 代码备用
    // $: view.mandalaMode = '3x3';
    $: view.mandalaMode = $mode;

    const sectionToNodeId = derived(
        view.documentStore,
        (state) => state.sections.section_id,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    const pinnedNodes = derived(
        view.documentStore,
        (state) => new Set(state.pinnedNodes.Ids),
    );
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );

    const subgridTheme = derived(
        view.viewStore,
        (state) => state.ui.mandala.subgridTheme,
    );
    const nodeStyles = derived(
        view.viewStore,
        (state) => state.styleRules.nodeStyles,
    );

    let containerRef: HTMLElement | null = null;
    onMount(() => {
        view.container = containerRef;
        focusContainer(view);

        contentWrapperObserver = new ResizeObserver(() => {
            recomputeDesktopSquareSize();
        });
        if (contentWrapperRef) {
            contentWrapperObserver.observe(contentWrapperRef);
        }
        recomputeDesktopSquareSize();
    });

    onDestroy(() => {
        contentWrapperObserver?.disconnect();
        contentWrapperObserver = null;
    });

    $: if (!Platform.isMobile) {
        $squareLayout;
        $showDetailSidebar;
        $detailSidebarWidth;
        recomputeDesktopSquareSize();
    }

    const requireNodeId = (section: string) => {
        const nodeId = $sectionToNodeId[section];
        return nodeId || null;
    };

    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );

    const selectedNodes = derived(
        view.viewStore,
        (state) => state.document.selectedNodes,
    );

    $: {
        if ($mode !== '3x3' && $subgridTheme) {
            view.viewStore.dispatch({ type: 'view/mandala/subgrid/exit' });
        }

        if ($mode !== '9x9') {
            view.mandalaActiveCell9x9 = null;
        } else {
            const section = $idToSection[$activeNodeId];
            if (!section) {
                view.mandalaActiveCell9x9 = null;
            } else {
                const cell = view.mandalaActiveCell9x9;
                const mapped = cell
                    ? sectionAtCell9x9(cell.row, cell.col)
                    : null;
                if (mapped !== section) {
                    view.mandalaActiveCell9x9 = posOfSection9x9(section);
                }
            }
        }
    }
    // 手机端全屏编辑状态判断
    $: isMobilePopupEditing = Platform.isMobile && $editingState.activeNodeId && !$editingState.isInSidebar;

    let showSettings = false;
    const toggleSettings = () => {
        showSettings = !showSettings;
    };

    const handleSave = () => {
        if ($editingState.activeNodeId) {
            view.inlineEditor.unloadNode($editingState.activeNodeId, false);
            view.viewStore.dispatch({
                type: 'view/editor/disable-main-editor',
            });
        }
    };

    const handleIncreaseFontSize = () => {
        mobilePopupFontSizeStore.setFontSize($mobilePopupFontSizeStore + 1);
    };

    const handleDecreaseFontSize = () => {
        mobilePopupFontSizeStore.setFontSize($mobilePopupFontSizeStore - 1);
    };
</script>

<div
    class="mandala-root"
    class:mandala-root--3={$mode === '3x3'}
    class:mandala-root--9={$mode === '9x9'}
    class:is-editing-mobile={isMobilePopupEditing}
    class:is-square-layout={Platform.isMobile && $showDetailSidebar}
    class:is-desktop-square-layout={!Platform.isMobile && $squareLayout}
    class:has-detail-sidebar={!Platform.isMobile && $showDetailSidebar}
    class:is-portrait={isPortrait}
    class:mandala-white-theme={!Platform.isMobile && $whiteThemeMode}
    style="--mandala-square-size: {squareSize}px; --desktop-square-size: {desktopSquareSize}px;"
>
    {#if isMobilePopupEditing}
        <div class="mobile-edit-header">
            <button class="header-btn settings-btn" on:click|stopPropagation={toggleSettings} aria-label="设置">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
                </svg>
            </button>
            <div class="mobile-edit-title">编辑格子</div>
            <button class="header-btn save-btn" on:click|stopPropagation={handleSave}>保存</button>
        </div>
        <div class="mobile-popup-editor-container">
            {#if showSettings}
                <div class="mobile-settings-panel" on:click|stopPropagation>
                    <div class="settings-row">
                        <span class="settings-label">字号</span>
                        <div class="font-size-controls">
                            <button class="control-btn" on:click|stopPropagation={handleDecreaseFontSize}>-</button>
                            <span class="font-value">{$mobilePopupFontSizeStore}px</span>
                            <button class="control-btn" on:click|stopPropagation={handleIncreaseFontSize}>+</button>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="mobile-popup-editor-body">
                <InlineEditor
                    nodeId={$editingState.activeNodeId}
                    style={$nodeStyles.get($editingState.activeNodeId)}
                    absoluteFontSize={$mobilePopupFontSizeStore}
                />
            </div>
        </div>
    {:else}
        <div class="mandala-topbar">
            <Toolbar />
            <VerticalToolbar />
        </div>
        <div class="mandala-content-wrapper" bind:this={contentWrapperRef}>
            <div
                class="mandala-scroll"
                bind:this={containerRef}
                tabindex="0"
                on:click={() => focusContainer(view)}
            >
                {#if $mode === '3x3'}
                    {@const theme = $subgridTheme}
                    {@const sections = theme
                        ? childSlots.map((slot) => (slot ? `${theme}.${slot}` : theme))
                        : coreSlots}
                    <div class="mandala-grid mandala-grid--3 mandala-grid--core">
                        {#each sections as section (section)}
                            {@const nodeId = requireNodeId(section)}
                            {#if nodeId}
                                <MandalaCard
                                    {nodeId}
                                    {section}
                                    active={nodeId === $activeNodeId}
                                    editing={$editingState.activeNodeId === nodeId &&
                                        !$editingState.isInSidebar &&
                                        !$showDetailSidebar}
                                    selected={$selectedNodes.has(nodeId)}
                                    pinned={$pinnedNodes.has(nodeId)}
                                    style={$nodeStyles.get(nodeId)}
                                    draggable={section !== '1' && !$subgridTheme}
                                />
                            {:else}
                                <div class="mandala-empty">{section}</div>
                            {/if}
                        {/each}
                    </div>
                {:else}
                    <MandalaOverviewSimple />
                {/if}
            </div>

            <MandalaDetailSidebar />
        </div>
    {/if}
</div>

<style>
    .mandala-root {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
        overscroll-behavior: contain;
        --mandala-core-gap: clamp(10px, 1vw, 18px);
        --mandala-gap: var(--node-gap-setting, calc(var(--mandala-core-gap) / 4));
        --mandala-block-gap: var(--mandala-gap);
        --mandala-card-width: 100%;
    }

    .mandala-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 4px var(--size-4-2);
        border-bottom: 1px solid var(--background-modifier-border);
        flex: 0 0 auto;
        position: relative;
        z-index: 1000;
        pointer-events: none;
    }
    .mandala-topbar :global(> *) {
        pointer-events: auto;
    }

    .mandala-toggle {
        padding: 6px 10px;
        border-radius: 8px;
        background: var(--interactive-normal);
        color: var(--text-normal);
        border: 1px solid var(--background-modifier-border);
        cursor: pointer;
    }

    .mandala-scroll {
        flex: 1 1 auto;
        overflow: auto;
        padding: 12px;
    }
    
    /* 桌面端调整格子右侧间距为 6px，为 6+6=12px 做准备 */
    :global(body:not(.is-mobile)) .mandala-scroll {
        padding: 12px 6px 12px 12px;
    }

    .mandala-content-wrapper {
        flex: 1 1 auto;
        display: flex;
        flex-direction: row;
        min-height: 0;
        overflow: hidden;
    }

    /* 桌面端正方形布局 + 无侧边栏时居中 */
    .is-desktop-square-layout:not(.has-detail-sidebar) .mandala-content-wrapper {
        justify-content: center;
    }

    /* 移动端正方形优先布局 */
    .is-square-layout .mandala-content-wrapper {
        flex-direction: row; /* 横排 */
    }
    .is-square-layout.is-portrait .mandala-content-wrapper {
        flex-direction: column; /* 竖排 */
    }

    /* 锁定网格为正方形 */
    .is-square-layout .mandala-scroll {
        flex: 0 0 auto;
        width: var(--mandala-square-size);
        height: 100%;
        padding: 12px;
    }

    .is-square-layout.is-portrait .mandala-scroll {
        width: 100%;
        height: var(--mandala-square-size);
    }

    /* 竖屏模式：纵向堆叠 */
    .is-portrait .mandala-content-wrapper {
        flex-direction: column;
    }

    /* 桌面端正方形布局 */
    .is-desktop-square-layout .mandala-scroll {
        flex: 0 0 auto;
        width: var(--desktop-square-size);
        height: var(--desktop-square-size);
        overflow: auto;
        align-self: center;
    }


    .mandala-blocks {
        display: grid;
        grid-template-columns: repeat(3, max-content);
        gap: var(--mandala-block-gap);
        justify-content: center;
        align-content: start;
    }

    .mandala-grid {
        display: grid;
        grid-template-columns: repeat(3, var(--node-width));
        gap: var(--mandala-gap);
        align-items: start;
    }

    /* 3×3 主视图：铺满可视区域（避免横向滚动） */
    .mandala-grid--core {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        align-items: stretch;
        justify-items: stretch;
    }

    .mandala-root--3 {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--3 .mandala-empty,
    .mandala-root--3 .mandala-mirror {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    /* 9×9：格子约等于 3×3 的 1/3，并铺满屏幕 */
    .mandala-root--9 {
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--9 .mandala-blocks {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        justify-content: stretch;
        align-content: stretch;
    }

    .mandala-root--9 .mandala-block {
        width: 100%;
        height: 100%;
    }

    .mandala-root--9 .mandala-grid {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        align-items: stretch;
    }

    .mandala-root--9 .mandala-empty,
    .mandala-root--9 .mandala-mirror {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-root--9 :global(.lng-prev) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: auto;
    }

    .mandala-root--9 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .mandala-root--9 :global(.draggable),
    .mandala-root--9 :global(.draggable .content) {
        height: 100%;
    }

    /* 3×3：内容超出时在格子内部滚动（避免撑开格子） */
    .mandala-root--3 :global(.lng-prev) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: auto;
    }

    .mandala-root--3 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .mandala-root--3 :global(.draggable),
    .mandala-root--3 :global(.draggable .content) {
        height: 100%;
    }

    .mandala-empty,
    .mandala-mirror {
        width: var(--node-width);
        min-height: var(--min-node-height);
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        padding: 8px;
        opacity: 0.7;
        position: relative;
        background: var(--background-primary);
    }

    .mandala-mirror :global(.lng-prev) {
        pointer-events: auto;
    }

    .mandala-center-cell {
        width: 100%;
        height: 100%;
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        opacity: 0.35;
        pointer-events: none;
    }
    .is-editing-mobile.mandala-root {
        height: 100dvh !important;
        overflow: hidden !important;
    }

    /* 移动端全屏编辑器样式 */
    .mobile-popup-editor-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100dvh;
        background-color: var(--background-primary);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-top: calc(env(safe-area-inset-top, 20px) + 50px);
    }

    .mobile-popup-editor-body {
        padding: 16px;
        flex: 1;
        background-color: var(--background-primary);
    }

    .mobile-edit-header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(env(safe-area-inset-top, 20px) + 50px);
        background-color: var(--background-primary-alt);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--background-modifier-border);
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 0 16px 12px 16px;
        z-index: 1001;
        pointer-events: auto;
    }

    .mobile-edit-title {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        font-weight: 600;
        font-size: 16px;
        color: var(--text-normal);
        pointer-events: none;
    }

    .header-btn {
        background: none;
        border: none;
        padding: 4px 8px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: none !important;
        color: var(--interactive-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
    }

    .header-btn:active {
        background-color: var(--background-modifier-hover);
    }

    .save-btn {
        font-weight: 600;
        color: var(--text-accent);
    }

    .settings-btn {
        opacity: 0.8;
        color: var(--text-muted);
    }
    .settings-btn:active {
        opacity: 1;
        color: var(--text-normal);
    }

    /* 设置面板 */
    .mobile-settings-panel {
        position: fixed;
        top: calc(env(safe-area-inset-top, 20px) + 50px);
        left: 0;
        width: 100%;
        background: var(--background-secondary);
        border-bottom: 1px solid var(--background-modifier-border);
        padding: 16px;
        z-index: 1002;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
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

    /* 全屏下隐藏一些卡片特有装饰 */
    .mobile-popup-editor-body :global(.mandala-section-label) {
        display: none;
    }
</style>
