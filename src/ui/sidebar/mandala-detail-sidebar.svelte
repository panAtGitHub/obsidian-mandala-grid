<script lang="ts">
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { derived } from 'src/lib/store/derived';
    import {
        DayPlanEnabledStore,
        DetailSidebarPreviewModeStore,
        ShowMandalaDetailSidebarStore,
        MandalaModeStore,
        Show3x3SubgridNavButtonsStore,
        ShowDayPlanTodayButtonStore,
        Show9x9ParallelNavButtonsStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { onDestroy, tick } from 'svelte';
    import Content from 'src/mandala-cell/view/content/content.svelte';
    import InlineEditor from 'src/mandala-cell/view/content/inline-editor.svelte';
    import SourcePreview from 'src/mandala-cell/view/content/source-preview.svelte';
    import { Platform, setIcon } from 'obsidian';
    import { createLayoutStore } from 'src/stores/view/orientation-store';
    import {
        enterSubgridForNode,
        exitCurrentSubgrid,
    } from 'src/helpers/views/mandala/mobile-navigation';
    import { openNodeEditor } from 'src/helpers/views/mandala/open-node-editor';
    import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';
    import { resolveDayPlanTodayNavigation } from 'src/lib/mandala/mandala-profile';
    import { lang } from 'src/lang/lang';

    const MIN_SIZE = 200;

    // 我们在侧边栏中也引入布局监听，仅用于响应 Resizer
    const layout = createLayoutStore();

    // 用于交互的临时偏移值（用于持久化网格尺寸的微调，如果有必要的话）
    // 用于 CSS transition 动画的宽度/高度，可以为 0
    let animatedSidebarSize = 0;
    // 实际大小值，不为 0
    let sidebarSize = MIN_SIZE; // Changed from MIN_WIDTH to MIN_SIZE
    let isResizing = false;
    let startX = 0;
    let startSize = 0;

    const view = getView();
    const showSidebarStore = ShowMandalaDetailSidebarStore(view);
    const detailSidebarPreviewMode = DetailSidebarPreviewModeStore(view);
    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );
    const mode = MandalaModeStore(view);
    const show3x3SubgridNavButtons = Show3x3SubgridNavButtonsStore(view);
    const show9x9ParallelNavButtons = Show9x9ParallelNavButtonsStore(view);
    const showDayPlanTodayButton = ShowDayPlanTodayButtonStore(view);
    const dayPlanEnabled = DayPlanEnabledStore(view);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const subgridTheme = derived(
        view.viewStore,
        (state) => state.ui.mandala.subgridTheme,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    const frontmatter = derived(
        view.documentStore,
        (state) => state.file.frontmatter,
    );
    let dayPlanTodayNavigation = resolveDayPlanTodayNavigation('');
    let activeSection: string | null = null;
    $: activeSection = $activeNodeId
        ? $idToSection[$activeNodeId] ?? null
        : null;
    $: activeCoreNumber = Number(activeSection?.split('.')[0] ?? '1') || 1;
    $: canExitSubgrid = Boolean($subgridTheme && $subgridTheme !== '1');
    $: canEnterSubgrid =
        !!$activeNodeId &&
        !(
            $subgridTheme &&
            $subgridTheme.includes('.') &&
            activeSection === $subgridTheme
        );
    $: canJumpPrevCore = activeCoreNumber > 1;
    $: dayPlanTodayNavigation = resolveDayPlanTodayNavigation($frontmatter);

    let editorContainer: HTMLElement;

    $: isEditingInSidebar =
        !Platform.isMobile &&
        $editingState.activeNodeId === $activeNodeId &&
        $editingState.isInSidebar;

    const focusEditor = async () => {
        await tick();
        if (editorContainer) {
            const editor = editorContainer.querySelector('.common-editor') as
                | HTMLTextAreaElement
                | HTMLDivElement;
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
            const root = view.contentEl.querySelector(
                '.mandala-scroll',
            ) as HTMLElement;
            if (root) root.focus();
        });
    }

    const unsub = showSidebarStore.subscribe((show) => {
        // 在移动端正方形布局下，侧边栏主要通过 flex: 1 填充
        // 我们利用这个状态来控制内部内容的可见性
        if (!Platform.isMobile) {
            // Only apply size logic on desktop
            if (show) {
                const savedSize =
                    view.plugin.settings.getValue().view
                        .mandalaDetailSidebarWidth;
                animatedSidebarSize =
                    savedSize || ($layout.isPortrait ? MIN_SIZE : MIN_SIZE); // Use MIN_SIZE
                sidebarSize = animatedSidebarSize;
            } else {
                animatedSidebarSize = 0;
            }
        }
    });

    onDestroy(() => {
        unsub();
    });

    // 处理缩放逻辑 (PC 端侧边栏大小)
    const onStartResize = (event: MouseEvent) => {
        if (Platform.isMobile) return;
        isResizing = true;
        startX = $layout.isPortrait ? event.clientY : event.clientX;
        startSize = animatedSidebarSize;
        view.contentEl.addEventListener('mousemove', onResize);
        view.contentEl.addEventListener('mouseup', onStopResize);

        // 设置全局光标，防止拖动过快导致光标闪烁
        document.body.setCssProps({
            cursor: $layout.isPortrait ? 'row-resize' : 'col-resize',
        });

        event.preventDefault();
        event.stopPropagation();
    };

    const onResize = (event: MouseEvent) => {
        if (!isResizing || Platform.isMobile) return;
        event.preventDefault();

        if ($layout.isPortrait) {
            const dy = event.clientY - startX;
            animatedSidebarSize = Math.max(MIN_SIZE, startSize - dy);
        } else {
            const dx = event.clientX - startX;
            animatedSidebarSize = Math.max(MIN_SIZE, startSize - dx);
        }
    };

    const onStopResize = () => {
        if (!isResizing || Platform.isMobile) return;
        isResizing = false;
        view.contentEl.removeEventListener('mousemove', onResize);
        view.contentEl.removeEventListener('mouseup', onStopResize);

        // 恢复全局光标
        document.body.setCssProps({ cursor: '' });

        // Desktop specific logic
        if (!Platform.isMobile) {
            const currentMin = $layout.isPortrait ? MIN_SIZE : MIN_SIZE; // Use MIN_SIZE
            if (animatedSidebarSize < currentMin) {
                animatedSidebarSize = currentMin;
            }
            sidebarSize = animatedSidebarSize;
            view.plugin.settings.dispatch({
                type: 'view/mandala-detail-sidebar/set-width',
                payload: {
                    width: animatedSidebarSize,
                },
            });
        }
    };
    const handleMobilePreviewDoubleTapEdit = (
        event: CustomEvent<{ nodeId: string }>,
    ) => {
        if (!Platform.isMobile) return;
        if (
            $detailSidebarPreviewMode !== 'rendered' &&
            $detailSidebarPreviewMode !== 'source'
        )
            return;
        const nodeId = event.detail?.nodeId;
        if (!nodeId) return;
        openNodeEditor(view, nodeId, {
            desktopIsInSidebar: true,
        });
    };

    const applyObsidianIcon = (node: HTMLElement, iconName: string) => {
        setIcon(node, iconName);
        return {
            update(nextIconName: string) {
                setIcon(node, nextIconName);
            },
        };
    };

    const enterSubgridFromFloatingButton = (event: MouseEvent) => {
        event.stopPropagation();
        if (!$activeNodeId || !canEnterSubgrid) return;
        enterSubgridForNode(view, $activeNodeId);
    };

    const exitSubgridFromFloatingButton = (event: MouseEvent) => {
        event.stopPropagation();
        if (!canExitSubgrid) return;
        exitCurrentSubgrid(view);
    };

    const jumpPrevCoreFromFloatingButton = (event: MouseEvent) => {
        event.stopPropagation();
        if (!canJumpPrevCore) return;
        jumpCoreTheme(view, 'up');
    };

    const jumpNextCoreFromFloatingButton = (event: MouseEvent) => {
        event.stopPropagation();
        jumpCoreTheme(view, 'down');
    };

    const focusDayPlanTodayFromFloatingButton = (event: MouseEvent) => {
        event.stopPropagation();
        view.focusDayPlanToday();
    };
</script>

<div
    class={'mandala-detail-sidebar' + (isResizing ? '' : ' size-transition')}
    class:is-mobile={Platform.isMobile}
    class:is-portrait={$layout.isPortrait}
    style={Platform.isMobile
        ? !$showSidebarStore
            ? 'display: none;'
            : ''
        : `--animated-sidebar-size: ${animatedSidebarSize}px; --sidebar-size: ${sidebarSize}px;`}
>
    <!-- 移动端 Resizer 位置：竖排在顶，横排在左 -->
    <div class="resizer" on:mousedown={onStartResize} />
    {#if $showSidebarStore}
        <div class="sidebar-content">
            {#if $activeNodeId}
                <div class="editor-wrapper">
                    {#key $activeNodeId}
                        {#if isEditingInSidebar}
                            <div
                                bind:this={editorContainer}
                                class="sidebar-editor-container"
                            >
                                <InlineEditor
                                    nodeId={$activeNodeId}
                                />
                            </div>
                        {:else if $detailSidebarPreviewMode === 'source'}
                            <SourcePreview
                                nodeId={$activeNodeId}
                                on:mobilePreviewDoubleTapEdit={handleMobilePreviewDoubleTapEdit}
                            />
                        {:else}
                            <Content
                                nodeId={$activeNodeId}
                                isInSidebar={false}
                                mobileSidebarRenderedEditEnabled={Platform.isMobile &&
                                    $detailSidebarPreviewMode === 'rendered'}
                                on:mobilePreviewDoubleTapEdit={handleMobilePreviewDoubleTapEdit}
                            />
                        {/if}
                    {/key}
                </div>
            {:else}
                <div class="no-selection">请选择一个格子进行编辑</div>
            {/if}
            {#if Platform.isMobile &&
                (($mode === '3x3' && $show3x3SubgridNavButtons) ||
                    ($dayPlanEnabled &&
                        $showDayPlanTodayButton &&
                        dayPlanTodayNavigation.targetSection &&
                        activeSection?.split('.')[0] !==
                            dayPlanTodayNavigation.targetSection))}
                <div class="mobile-subgrid-floating-controls">
                    {#if $mode === '3x3' && $show3x3SubgridNavButtons}
                        <button
                            class="mobile-subgrid-floating-btn"
                            type="button"
                            aria-label="退出上一层子九宫格"
                            disabled={!canExitSubgrid}
                            on:click={exitSubgridFromFloatingButton}
                        >
                            <span
                                class="mobile-subgrid-floating-btn__icon"
                                use:applyObsidianIcon={'chevron-up'}
                            />
                        </button>
                        <button
                            class="mobile-subgrid-floating-btn"
                            type="button"
                            aria-label="进入下一层子九宫格"
                            disabled={!canEnterSubgrid}
                            on:click={enterSubgridFromFloatingButton}
                        >
                            <span
                                class="mobile-subgrid-floating-btn__icon"
                                use:applyObsidianIcon={'chevron-down'}
                            />
                        </button>
                    {/if}
                    {#if $dayPlanEnabled &&
                        $showDayPlanTodayButton &&
                        dayPlanTodayNavigation.targetSection &&
                        activeSection?.split('.')[0] !==
                            dayPlanTodayNavigation.targetSection}
                        <button
                            class="mobile-subgrid-floating-btn mobile-day-plan-today-btn"
                            type="button"
                            aria-label={lang.day_plan_today_button_label}
                            on:click={focusDayPlanTodayFromFloatingButton}
                        >
                            <span
                                class="mobile-subgrid-floating-btn__icon"
                                use:applyObsidianIcon={'calendar-days'}
                            />
                        </button>
                    {/if}
                </div>
            {:else if Platform.isMobile &&
                (($mode === '9x9' && $show9x9ParallelNavButtons) ||
                    ($dayPlanEnabled &&
                        $showDayPlanTodayButton &&
                        dayPlanTodayNavigation.targetSection &&
                        activeSection?.split('.')[0] !==
                            dayPlanTodayNavigation.targetSection))}
                <div class="mobile-subgrid-floating-controls">
                    {#if $mode === '9x9' && $show9x9ParallelNavButtons}
                        <button
                            class="mobile-subgrid-floating-btn"
                            type="button"
                            aria-label="进入上一层核心九宫格"
                            disabled={!canJumpPrevCore}
                            on:click={jumpPrevCoreFromFloatingButton}
                        >
                            <span
                                class="mobile-subgrid-floating-btn__icon"
                                use:applyObsidianIcon={'chevron-left'}
                            />
                        </button>
                        <button
                            class="mobile-subgrid-floating-btn"
                            type="button"
                            aria-label="进入下一层核心九宫格"
                            on:click={jumpNextCoreFromFloatingButton}
                        >
                            <span
                                class="mobile-subgrid-floating-btn__icon"
                                use:applyObsidianIcon={'chevron-right'}
                            />
                        </button>
                    {/if}
                    {#if $dayPlanEnabled &&
                        $showDayPlanTodayButton &&
                        dayPlanTodayNavigation.targetSection &&
                        activeSection?.split('.')[0] !==
                            dayPlanTodayNavigation.targetSection}
                        <button
                            class="mobile-subgrid-floating-btn mobile-day-plan-today-btn"
                            type="button"
                            aria-label={lang.day_plan_today_button_label}
                            on:click={focusDayPlanTodayFromFloatingButton}
                        >
                            <span
                                class="mobile-subgrid-floating-btn__icon"
                                use:applyObsidianIcon={'calendar-days'}
                            />
                        </button>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .mandala-detail-sidebar {
        flex: 0 0 auto;
        width: var(--animated-sidebar-size); /* PC 默认 */
        position: relative;
        overflow: hidden;
        background-color: transparent;
        display: flex;
        flex-direction: column;
        --font-text-size: var(--mandala-font-sidebar, 16px);
    }

    /* 桌面端正方形布局：侧边栏吃掉剩余空间，并贴合右侧 */
    :global(.is-desktop-square-layout.has-detail-sidebar)
        .mandala-detail-sidebar {
        flex: 1 1 var(--animated-sidebar-size);
        width: auto;
        min-width: var(--animated-sidebar-size);
        height: 100%;
        background-color: var(--background-container);
    }

    .size-transition {
        transition:
            width 0.3s ease,
            height 0.3s ease;
    }

    .mandala-detail-sidebar.is-portrait {
        width: 100%;
        height: var(--animated-sidebar-size);
    }

    /* 移动端填充方案 */
    .is-mobile.mandala-detail-sidebar {
        flex: 1 1 auto;
        width: auto;
        height: auto; /* Reset height for mobile */
    }

    /* 当侧边栏关闭时，强制在移动端不占用 Flex 空间 */
    .is-mobile.mandala-detail-sidebar[style*='display: none'] {
        flex: 0 0 0px !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    .is-mobile.is-portrait.mandala-detail-sidebar {
        width: 100%;
        border-top: 1px solid var(--background-modifier-border);
    }

    .is-mobile:not(.is-portrait).mandala-detail-sidebar {
        height: 100%;
        border-left: 1px solid var(--background-modifier-border);
    }

    .size-transition {
        /* This class is now applied to the main element, so it handles width/height transitions */
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
        width: 8px;
        z-index: 10;
    }

    .is-portrait .resizer {
        width: 100%;
        height: 8px;
        top: 0;
        left: 0;
        cursor: row-resize;
    }

    .resizer:hover {
        background-color: var(--color-accent);
        opacity: 0.3;
    }

    .sidebar-content {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        position: relative;
        /* 移动端不再有最小宽度限制，自适应填充 */
        padding: 12px;
        overflow-y: auto;
    }

    .mobile-subgrid-floating-controls {
        position: absolute;
        right: 12px;
        top: 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 12;
        pointer-events: auto;
    }

    .mobile-subgrid-floating-btn {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-s);
    }

    .mobile-subgrid-floating-btn:disabled {
        opacity: 0.35;
    }

    .mobile-subgrid-floating-btn__icon {
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    /* 桌面端详情侧栏左侧不再额外留白，中间空白由主视图提供 */
    :global(body:not(.is-mobile)) .sidebar-content {
        padding: 12px 12px 12px 0;
    }

    /* 桌面端竖屏时，调整顶部间距为 6px */
    :global(body:not(.is-mobile)) .is-portrait .sidebar-content {
        padding: 6px 12px 12px 12px;
    }

    .is-portrait .sidebar-content {
        min-width: 0;
        padding: 0 12px 12px 12px;
    }

    .editor-wrapper {
        flex: 1;
        min-height: 0;
        background-color: var(--background-primary);
        border-radius: 0px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid var(--background-modifier-border);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .sidebar-editor-container {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }

    .no-selection {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-style: italic;
        background-color: var(--background-primary);
        border-radius: 0px;
        border: 1px dashed var(--background-modifier-border);
    }

    /* 适配 InlineEditor 在侧边栏的样式 */
    :global(.mandala-detail-sidebar .editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100% !important;
        overflow: hidden;
        background-color: transparent !important;
    }

    :global(.mandala-detail-sidebar .mandala-inline-editor) {
        height: 100% !important;
        min-height: 0 !important;
    }

    :global(.mandala-detail-sidebar .cm-editor) {
        height: 100% !important;
    }

    :global(.mandala-detail-sidebar .cm-editor .cm-scroller) {
        overflow: auto !important;
    }

    :global(.mandala-detail-sidebar .view-content) {
        background-color: transparent !important;
        padding: 6px 6px 10px 12px !important; /* 匹配 Content.svelte 原生边距 */
    }

    :global(.mandala-detail-sidebar .lng-prev) {
        padding: 6px 6px 10px 12px !important; /* 匹配 Content.svelte 原生边距 */
        background-color: transparent !important;
    }

    /* 消除侧边栏第一行元素（如标题）的多余顶部边距，实现视觉对齐 */
    :global(.mandala-detail-sidebar .lng-prev > *:first-child) {
        margin-top: 0 !important;
    }
</style>
