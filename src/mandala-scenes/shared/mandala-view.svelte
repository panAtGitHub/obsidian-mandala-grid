<script lang="ts">
    import { Platform } from 'obsidian';
    import { onDestroy, onMount } from 'svelte';
    import { derived } from 'src/shared/store/derived';
    import {
        DayPlanEnabledStore,
        MandalaA4ModeStore,
        MandalaA4OrientationStore,
        MandalaBorderOpacityStore,
        MandalaGridHighlightColorStore,
        MandalaGridHighlightWidthStore,
        MandalaDetailSidebarWidthStore,
        MandalaModeStore,
        MandalaBackgroundModeStore,
        MandalaGridCustomLayoutsStore,
        MandalaGridSelectedLayoutIdStore,
        Nx9RowsPerPageStore,
        MandalaSectionColorOpacityStore,
        Show3x3SubgridNavButtonsStore,
        ShowDayPlanTodayButtonStore,
        ShowMandalaDetailSidebarStore,
        SquareLayoutStore,
        WhiteThemeModeStore,
        WeekStartStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import {
        posOfSection9x9,
        sectionAtCell9x9,
    } from 'src/mandala-display/logic/mandala-grid';
    import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';
    import NineByNineLayout from 'src/mandala-scenes/view-9x9/layout.svelte';
    import VerticalToolbar from 'src/ui/toolbar/vertical/vertical-toolbar.svelte';
    import Toolbar from 'src/ui/toolbar/main/toolbar.svelte';
    import ToolbarCenter from 'src/ui/toolbar/main/toolbar-center.svelte';
    import MandalaDetailSidebar from 'src/ui/sidebar/mandala-detail-sidebar.svelte';
    import { createLayoutStore } from 'src/stores/view/orientation-store';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import MobileFullScreenSearch from 'src/ui/modals/mobile-fullscreen-search.svelte';
    import MobileNativeEditorSheet from 'src/ui/modals/mobile-native-editor-sheet.svelte';
    import { mobilePopupFontSizeStore } from 'src/stores/ui/mobile-popup-font-store';
    import { SectionColorBySectionStore } from 'src/mandala-display/stores/section-colors-store';
    import { PinnedSectionsStore } from 'src/mandala-display/stores/document-derived-stores';
    import { parseDayPlanFrontmatter } from 'src/mandala-display/logic/day-plan';
    import { lang } from 'src/lang/lang';
    import Mandala3x3Layout from 'src/mandala-scenes/view-3x3/layout.svelte';
    import {
        buildThreeByThreeCells,
        enterThreeByThreeSubgridFromButton,
        exitThreeByThreeSubgridFromButton,
        focusThreeByThreeTodayFromButton,
        getThreeByThreeDownButtonLabel,
        getThreeByThreeUpButtonLabel,
        resolveThreeByThreeTheme,
        syncThreeByThreeSceneState,
    } from 'src/mandala-scenes/view-3x3/scene-state';
    import Nx9Layout from 'src/mandala-scenes/view-nx9/layout.svelte';
    import WeekPlanLayout from 'src/mandala-scenes/view-7x9/layout.svelte';
    import {
        normalizeNx9VisibleSection,
        resolveNx9Context,
    } from 'src/mandala-scenes/view-nx9/context';
    import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';
    import { setActiveCellWeek7x9 } from 'src/mandala-interaction/helpers/set-active-cell-week-7x9';
    import { resolveWeekPlanContext } from 'src/mandala-display/logic/week-plan-context';
    import { createMobileEditorViewportController } from 'src/mandala-scenes/shared/mobile-editor-viewport';

    const view = getView();
    const layout = createLayoutStore();
    const search = searchStore(view);

    // 默认九宫格大小（如果是移动端且开启该逻辑）
    $: squareSize = $layout.squareSize;
    $: isPortrait = $layout.isPortrait;

    const mode = MandalaModeStore(view);
    const selectedLayoutId = MandalaGridSelectedLayoutIdStore(view);
    const customLayouts = MandalaGridCustomLayoutsStore(view);
    const a4Mode = MandalaA4ModeStore(view);
    const a4Orientation = MandalaA4OrientationStore(view);
    const borderOpacity = MandalaBorderOpacityStore(view);
    const gridHighlightColor = MandalaGridHighlightColorStore(view);
    const gridHighlightWidth = MandalaGridHighlightWidthStore(view);
    const show3x3SubgridNavButtons = Show3x3SubgridNavButtonsStore(view);
    const showDayPlanTodayButton = ShowDayPlanTodayButtonStore(view);
    const dayPlanEnabled = DayPlanEnabledStore(view);
    const nx9RowsPerPage = Nx9RowsPerPageStore(view);
    const weekStart = WeekStartStore(view);

    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const detailSidebarWidth = MandalaDetailSidebarWidthStore(view);
    const squareLayout = SquareLayoutStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);

    const getBaseTheme = (section: string | undefined) =>
        section ? section.split('.')[0] : '1';

    const MIN_DESKTOP_DETAIL_SIDEBAR_SIZE = 200;

    let desktopSquareSize = 0;
    let contentWrapperRef: HTMLElement | null = null;
    let contentWrapperObserver: ResizeObserver | null = null;
    let mobilePopupEditorBodyEl: HTMLDivElement | null = null;
    const mobileEditorViewport = createMobileEditorViewportController();
    const mobileViewportHeight = mobileEditorViewport.height;
    const mobileViewportOffsetTop = mobileEditorViewport.offsetTop;
    const mobileViewportBottomInset = mobileEditorViewport.bottomInset;
    const mobileKeyboardOverlayFallback =
        mobileEditorViewport.keyboardFallback;

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

    const sectionToNodeId = derived(
        view.documentStore,
        (state) => state.sections.section_id,
    );
    const idToSection = derived(
        view.documentStore,
        (state) => state.sections.id_section,
    );
    const pinnedSections = PinnedSectionsStore(view);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    let activeSection: string | null = null;
    $: activeSection = $activeNodeId
        ? $idToSection[$activeNodeId] ?? null
        : null;
    $: activeCoreSection = activeSection?.split('.')[0] ?? null;

    const subgridTheme = derived(
        view.viewStore,
        (state) => state.ui.mandala.subgridTheme,
    );
    const documentState = derived(view.documentStore, (state) => state);
    const weekAnchorDate = derived(
        view.viewStore,
        (state) => state.ui.mandala.weekAnchorDate,
    );
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);
    const hasOpenOverlayModal = derived(view.viewStore, (state) => {
        const controls = state.ui.controls;
        return controls.showHelpSidebar || controls.showSettingsSidebar;
    });

    let containerRef: HTMLElement | null = null;
    onMount(() => {
        view.container = containerRef;
        focusContainer(view);
        mobileEditorViewport.mount();

        contentWrapperObserver = new ResizeObserver(() => {
            recomputeDesktopSquareSize();
        });
        if (contentWrapperRef) {
            contentWrapperObserver.observe(contentWrapperRef);
        }
        recomputeDesktopSquareSize();
    });

    onDestroy(() => {
        mobileEditorViewport.destroy();
        contentWrapperObserver?.disconnect();
        contentWrapperObserver = null;
    });

    $: {
        mobileEditorViewport.sync(
            isMobilePopupEditing,
            mobilePopupEditorBodyEl,
        );
    }

    $: if (!Platform.isMobile) {
        $squareLayout;
        $showDetailSidebar;
        $detailSidebarWidth;
        recomputeDesktopSquareSize();
    }

    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );

    const selectedNodes = derived(
        view.viewStore,
        (state) => state.document.selectedNodes,
    );
    let dayPlanTodayTargetSection: string | null = null;
    let cachedDayPlanFrontmatter: string | null = null;
    let cachedDayPlan = parseDayPlanFrontmatter('');
    const getCachedDayPlan = (frontmatter: string) => {
        if (frontmatter !== cachedDayPlanFrontmatter) {
            cachedDayPlanFrontmatter = frontmatter;
            cachedDayPlan = parseDayPlanFrontmatter(frontmatter);
        }
        return cachedDayPlan;
    };

    $: {
        if ($mode && !$subgridTheme) {
            view.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: '1' },
            });
        }

        if (
            $mode === 'week-7x9' &&
            (!$dayPlanEnabled ||
                !view.plugin.settings.getValue().general.weekPlanEnabled ||
                !getCachedDayPlan($documentState.file.frontmatter))
        ) {
            view.ensureCompatibleMandalaMode($documentState.file.frontmatter);
        }

        if (
            $mode === 'nx9' &&
            !view.canUseNx9Mode($documentState.file.frontmatter)
        ) {
            view.ensureCompatibleMandalaMode($documentState.file.frontmatter);
        }

        if (
            $mode === '3x3' &&
            $subgridTheme &&
            $subgridTheme !== '1' &&
            !$sectionToNodeId[$subgridTheme]
        ) {
            view.viewStore.dispatch({
                type: 'view/mandala/subgrid/enter',
                payload: { theme: '1' },
            });
        }

        if ($mode !== '9x9') {
            if (view.mandalaActiveCell9x9) {
                setActiveCell9x9(view, null);
            }
        } else {
            const section = $idToSection[$activeNodeId];
            const baseTheme = getBaseTheme(section);
            if (!section) {
                if (view.mandalaActiveCell9x9) {
                    setActiveCell9x9(view, null);
                }
            } else {
                const cell = view.mandalaActiveCell9x9;
                const pos = posOfSection9x9(
                    section,
                    $selectedLayoutId,
                    baseTheme,
                    $customLayouts,
                );
                if (cell) {
                    const mapped = sectionAtCell9x9(
                        cell.row,
                        cell.col,
                        $selectedLayoutId,
                        baseTheme,
                        $customLayouts,
                    );
                    if (!mapped || mapped !== section) {
                        setActiveCell9x9(view, pos ?? null);
                    }
                }
            }
        }

        if ($mode !== 'nx9') {
            if (view.mandalaActiveCellNx9) {
                setActiveCellNx9(view, null);
            }
        } else {
            const section = $idToSection[$activeNodeId];
            const nx9Context = resolveNx9Context({
                sectionIdMap: $documentState.sections.section_id,
                documentContent: $documentState.document.content,
                rowsPerPage: $nx9RowsPerPage,
                activeSection: section,
                activeCell: view.mandalaActiveCellNx9,
            });
            const visibleSection = normalizeNx9VisibleSection(section);
            const pos = nx9Context.posForSection(section);
            const cell = view.mandalaActiveCellNx9;
            if (!section) {
                if (cell) {
                    setActiveCellNx9(view, null);
                }
            } else if (!cell && pos) {
                setActiveCellNx9(view, {
                    row: pos.row,
                    col: pos.col,
                    page: pos.page,
                });
            } else if (cell) {
                const mapped = nx9Context.sectionForCell(
                    cell.row,
                    cell.col,
                    cell.page,
                );
                const isGhostCreateCell = nx9Context.isGhostCreateCell(
                    cell.row,
                    cell.col,
                    cell.page,
                );
                if (!mapped && !isGhostCreateCell) {
                    setActiveCellNx9(
                        view,
                        pos
                            ? {
                                  row: pos.row,
                                  col: pos.col,
                                  page: pos.page,
                              }
                            : null,
                    );
                } else if (mapped && mapped !== visibleSection) {
                    setActiveCellNx9(
                        view,
                        pos
                            ? {
                                  row: pos.row,
                                  col: pos.col,
                                  page: pos.page,
                              }
                            : null,
                    );
                }
            }
        }

        if ($mode !== 'week-7x9') {
            if (view.mandalaActiveCellWeek7x9) {
                setActiveCellWeek7x9(view, null);
            }
        } else {
            const weekContext = resolveWeekPlanContext({
                frontmatter: $documentState.file.frontmatter,
                anchorDate: $weekAnchorDate,
                weekStart: $weekStart,
            });
            const anchorDate = weekContext.anchorDate;
            if (!$weekAnchorDate) {
                view.viewStore.dispatch({
                    type: 'view/mandala/week-anchor-date/set',
                    payload: { date: anchorDate },
                });
            }
            const section = $idToSection[$activeNodeId];
            const pos = weekContext.posForSection(section);
            const cell = view.mandalaActiveCellWeek7x9;
            if (!section) {
                if (cell) {
                    setActiveCellWeek7x9(view, null);
                }
            } else if (cell) {
                const mapped = weekContext.sectionForCell(cell.row, cell.col);
                if (!mapped || mapped !== section) {
                    setActiveCellWeek7x9(view, pos ?? null);
                }
            }
        }
    }

    $: dayPlanTodayTargetSection = syncThreeByThreeSceneState({
        view,
        mode: $mode,
        subgridTheme: $subgridTheme,
        documentState: $documentState,
        sectionToNodeId: $sectionToNodeId,
    });
    // 手机端编辑统一走原生 section 会话，不再走 InlineEditor 弹层路径。
    let isMobilePopupEditing = false;
    $: isMobileFullScreenSearch = Platform.isMobile && $search.showInput;

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

    const handleMobileEditorFocusIn = () => {
        mobileEditorViewport.handleFocusIn();
    };

    const handleMobileEditorFocusOut = () => {
        mobileEditorViewport.handleFocusOut();
    };

    $: threeByThreeTheme = resolveThreeByThreeTheme($subgridTheme);
    $: threeByThreeCells = buildThreeByThreeCells({
        theme: threeByThreeTheme,
        selectedLayoutId: $selectedLayoutId,
        customLayouts: $customLayouts,
        sectionToNodeId: $sectionToNodeId,
        activeNodeId: $activeNodeId,
        editingState: $editingState,
        selectedNodes: $selectedNodes,
        pinnedSections: $pinnedSections,
        showDetailSidebar: $showDetailSidebar,
        backgroundMode: $backgroundMode,
        sectionColors: $sectionColors,
        sectionColorOpacity: $sectionColorOpacity,
        whiteThemeMode: $whiteThemeMode,
    });
</script>

<div
    class="mandala-root"
    class:mandala-root--3={$mode === '3x3'}
    class:mandala-root--9={$mode === '9x9'}
    class:mandala-root--nx9={$mode === 'nx9'}
    class:mandala-root--week={$mode === 'week-7x9'}
    class:is-editing-mobile={isMobilePopupEditing}
    class:is-square-layout={Platform.isMobile && $showDetailSidebar}
    class:is-desktop-square-layout={!Platform.isMobile && $squareLayout}
    class:has-detail-sidebar={!Platform.isMobile && $showDetailSidebar}
    class:is-portrait={isPortrait}
    class:mandala-white-theme={$whiteThemeMode}
    class:mandala-a4-mode={$a4Mode}
    class:mandala-a4-landscape={$a4Mode && $a4Orientation === 'landscape'}
    style="--mandala-square-size: {squareSize}px; --desktop-square-size: {desktopSquareSize}px; --mandala-border-opacity: {$borderOpacity}%; --mandala-grid-highlight-color: {$gridHighlightColor ||
        'var(--mandala-color-selection)'}; --mandala-grid-highlight-width: {$gridHighlightWidth}px; --vvh: {$mobileViewportHeight ||
        window.innerHeight}px; --vvo: {$mobileViewportOffsetTop}px; --vvb: {$mobileViewportBottomInset}px; --vkf: {$mobileKeyboardOverlayFallback}px;"
>
    {#if isMobilePopupEditing}
        <MobileNativeEditorSheet
            nodeId={$editingState.activeNodeId}
            fontSize={$mobilePopupFontSizeStore}
            bind:editorBodyEl={mobilePopupEditorBodyEl}
            on:save={handleSave}
            on:focusin={handleMobileEditorFocusIn}
            on:focusout={handleMobileEditorFocusOut}
            on:increasefontsize={handleIncreaseFontSize}
            on:decreasefontsize={handleDecreaseFontSize}
        />
    {:else if isMobileFullScreenSearch}
        <MobileFullScreenSearch />
    {:else}
        <div class="mandala-topbar">
            <div class="mandala-topbar__left">
                <Toolbar />
            </div>
            <div class="mandala-topbar__center">
                <ToolbarCenter />
            </div>
            <div class="mandala-topbar__right">
                <VerticalToolbar />
            </div>
        </div>
        <div class="mandala-content-wrapper" bind:this={contentWrapperRef}>
            <div
                class="mandala-scroll"
                bind:this={containerRef}
                tabindex="0"
                on:click={() => focusContainer(view)}
            >
                {#if $mode === '3x3'}
                    <Mandala3x3Layout
                        cells={threeByThreeCells}
                        theme={threeByThreeTheme}
                        animateSwap={$swapState.animate}
                        show3x3SubgridNavButtons={$show3x3SubgridNavButtons}
                        hasOpenOverlayModal={$hasOpenOverlayModal}
                        dayPlanEnabled={$dayPlanEnabled}
                        showDayPlanTodayButton={$showDayPlanTodayButton}
                        {dayPlanTodayTargetSection}
                        {activeCoreSection}
                        todayButtonLabel={lang.day_plan_today_button_label}
                        enterSubgridFromButton={(event, nodeId) =>
                            enterThreeByThreeSubgridFromButton(
                                view,
                                event,
                                nodeId,
                            )}
                        exitSubgridFromButton={(event) =>
                            exitThreeByThreeSubgridFromButton(view, event)}
                        focusDayPlanTodayFromButton={(event) =>
                            focusThreeByThreeTodayFromButton(view, event)}
                        getUpButtonLabel={getThreeByThreeUpButtonLabel}
                        getDownButtonLabel={getThreeByThreeDownButtonLabel}
                    />
                {:else if $mode === '9x9'}
                    <NineByNineLayout />
                {:else if $mode === 'nx9'}
                    <Nx9Layout />
                {:else}
                    <WeekPlanLayout />
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
        --mandala-gap: var(
            --node-gap-setting,
            calc(var(--mandala-core-gap) / 4)
        );
        --mandala-block-gap: var(--mandala-gap);
        --mandala-card-width: 100%;
        --mandala-gray-block-base: color-mix(
            in srgb,
            var(--background-modifier-border) 70%,
            var(--background-primary)
        );
        --mandala-border-opacity: 100%;
        --mandala-border-color: color-mix(
            in srgb,
            var(--text-normal) var(--mandala-border-opacity),
            transparent
        );
        --mandala-a4-width: 210mm;
        --mandala-a4-height: 297mm;
        --mandala-a4-margin: 1.27cm;
    }

    .mandala-topbar {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
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

    .mandala-topbar__left,
    .mandala-topbar__center,
    .mandala-topbar__right {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        min-width: 0;
    }
    .mandala-topbar__left {
        justify-self: start;
    }
    .mandala-topbar__center {
        justify-self: center;
        overflow: hidden;
    }
    .mandala-topbar__right {
        justify-self: end;
    }

    .mandala-scroll {
        flex: 1 1 auto;
        overflow: auto;
        padding: 12px;
    }

    /* 桌面端主滚动区保持左右对称外边距 */
    :global(body:not(.is-mobile))
        .mandala-root:not(.mandala-a4-mode)
        .mandala-scroll {
        padding: 12px;
    }

    .mandala-content-wrapper {
        flex: 1 1 auto;
        display: flex;
        flex-direction: row;
        min-height: 0;
        overflow: hidden;
    }

    /* 桌面端正方形布局 + 无侧边栏时居中 */
    .is-desktop-square-layout:not(.has-detail-sidebar)
        .mandala-content-wrapper {
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

    .mandala-a4-mode .mandala-content-wrapper {
        justify-content: center;
        overflow: auto;
        align-items: flex-start;
    }

    .mandala-a4-mode .mandala-scroll {
        flex: 0 0 auto;
        width: var(--mandala-a4-width);
        height: var(--mandala-a4-height);
        overflow: hidden;
        align-self: flex-start;
        margin: 0 auto;
        padding: var(--mandala-a4-margin);
        box-sizing: border-box;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        position: relative;
    }

    .mandala-a4-mode.mandala-a4-landscape .mandala-scroll {
        width: var(--mandala-a4-height);
        height: var(--mandala-a4-width);
    }

    .mandala-a4-mode {
        --mandala-a4-content-width: calc(
            var(--mandala-a4-width) - (2 * var(--mandala-a4-margin))
        );
        --mandala-a4-content-height: calc(
            var(--mandala-a4-height) - (2 * var(--mandala-a4-margin))
        );
    }

    .mandala-a4-mode.mandala-a4-landscape {
        --mandala-a4-content-width: calc(
            var(--mandala-a4-height) - (2 * var(--mandala-a4-margin))
        );
        --mandala-a4-content-height: calc(
            var(--mandala-a4-width) - (2 * var(--mandala-a4-margin))
        );
    }

    .mandala-a4-mode.is-desktop-square-layout .mandala-scroll {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .mandala-a4-mode.is-desktop-square-layout :global(.simple-9x9-grid) {
        width: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
        height: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
    }

    .mandala-a4-mode.is-desktop-square-layout :global(.simple-9x9-shell) {
        display: flex;
        align-items: center;
        justify-content: center;
        width: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
        height: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
    }

    .mandala-a4-mode.mandala-root--3:not(.mandala-white-theme)
        :global(.mandala-card),
    .mandala-a4-mode.mandala-root--nx9:not(.mandala-white-theme)
        :global(.mandala-card),
    .mandala-a4-mode.mandala-root--week:not(.mandala-white-theme)
        :global(.mandala-card) {
        border: 1px solid var(--text-normal) !important;
        border-left-width: 1px !important;
        border-radius: 0 !important;
        box-shadow: none !important;
    }

    .mandala-root--3:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card),
    .mandala-root--nx9:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card),
    .mandala-root--week:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card) {
        border-left-width: 0 !important;
        border-left-style: solid !important;
    }

    .mandala-root--3:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--active),
    .mandala-root--3:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--selected),
    .mandala-root--nx9:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--active),
    .mandala-root--nx9:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--selected),
    .mandala-root--week:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--active),
    .mandala-root--week:not(.mandala-white-theme):not(.mandala-a4-mode)
        :global(.mandala-card.node-border--selected) {
        border-left-color: transparent !important;
    }

    .mandala-a4-mode.mandala-root--3 :global(.mandala-card.active-node),
    .mandala-a4-mode.mandala-root--3
        :global(.mandala-card.node-border--selected),
    .mandala-a4-mode.mandala-root--nx9 :global(.mandala-card.active-node),
    .mandala-a4-mode.mandala-root--nx9
        :global(.mandala-card.node-border--selected),
    .mandala-a4-mode.mandala-root--week :global(.mandala-card.active-node),
    .mandala-a4-mode.mandala-root--week
        :global(.mandala-card.node-border--selected),
    .mandala-white-theme.mandala-root--3 :global(.mandala-card.active-node),
    .mandala-white-theme.mandala-root--3
        :global(.mandala-card.node-border--selected),
    .mandala-white-theme.mandala-root--nx9 :global(.mandala-card.active-node),
    .mandala-white-theme.mandala-root--nx9
        :global(.mandala-card.node-border--selected),
    .mandala-white-theme.mandala-root--week :global(.mandala-card.active-node),
    .mandala-white-theme.mandala-root--week
        :global(.mandala-card.node-border--selected) {
        position: relative;
    }

    .mandala-a4-mode.mandala-root--3 :global(.mandala-card.active-node)::after,
    .mandala-a4-mode.mandala-root--3
        :global(.mandala-card.node-border--selected)::after,
    .mandala-a4-mode.mandala-root--nx9
        :global(.mandala-card.active-node)::after,
    .mandala-a4-mode.mandala-root--nx9
        :global(.mandala-card.node-border--selected)::after,
    .mandala-a4-mode.mandala-root--week
        :global(.mandala-card.active-node)::after,
    .mandala-a4-mode.mandala-root--week
        :global(.mandala-card.node-border--selected)::after,
    .mandala-white-theme.mandala-root--3
        :global(.mandala-card.active-node)::after,
    .mandala-white-theme.mandala-root--3
        :global(.mandala-card.node-border--selected)::after,
    .mandala-white-theme.mandala-root--nx9
        :global(.mandala-card.active-node)::after,
    .mandala-white-theme.mandala-root--nx9
        :global(.mandala-card.node-border--selected)::after,
    .mandala-white-theme.mandala-root--week
        :global(.mandala-card.active-node)::after,
    .mandala-white-theme.mandala-root--week
        :global(.mandala-card.node-border--selected)::after {
        content: '';
        position: absolute;
        inset: 2px;
        border: var(--mandala-grid-highlight-width, 2px) solid
            var(--mandala-grid-highlight-color, var(--mandala-color-selection));
        pointer-events: none;
        box-sizing: border-box;
        border-radius: 0;
    }

    .mandala-root--3 {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--week {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--nx9 {
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    /* 9×9：格子约等于 3×3 的 1/3，并铺满屏幕 */
    .mandala-root--9 {
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--9 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    :global(.mandala-idle-scrollbar) {
        --mandala-idle-scrollbar-thumb: var(--color-base-30);
        --mandala-idle-scrollbar-thumb-active: var(--color-base-40);
        --mandala-idle-scrollbar-size: 2px;
        overflow: auto;
        overflow: overlay;
        scrollbar-gutter: stable;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
        --scrollbar-thumb-bg: transparent !important;
        --scrollbar-active-thumb-bg: transparent !important;
        --scrollbar-bg: transparent !important;
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar) {
        width: var(--mandala-idle-scrollbar-size);
        height: var(--mandala-idle-scrollbar-size);
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar-track) {
        background: transparent;
    }

    :global(.mandala-idle-scrollbar::-webkit-scrollbar-thumb) {
        background: transparent;
        border-radius: 999px;
    }

    :global(.mandala-idle-scrollbar.is-scrollbar-visible),
    :global(.mandala-card.active-node .mandala-idle-scrollbar),
    :global(.mandala-card.node-border--selected .mandala-idle-scrollbar),
    :global(.mandala-card:hover .mandala-idle-scrollbar) {
        scrollbar-width: thin;
        scrollbar-color: var(--mandala-idle-scrollbar-thumb) transparent;
        --scrollbar-thumb-bg: var(--mandala-idle-scrollbar-thumb) !important;
        --scrollbar-active-thumb-bg: var(
            --mandala-idle-scrollbar-thumb-active
        ) !important;
        --scrollbar-bg: transparent !important;
    }

    :global(.mandala-idle-scrollbar.is-scrollbar-visible::-webkit-scrollbar),
    :global(
            .mandala-card.active-node .mandala-idle-scrollbar::-webkit-scrollbar
        ),
    :global(
            .mandala-card.node-border--selected
                .mandala-idle-scrollbar::-webkit-scrollbar
        ),
    :global(.mandala-card:hover .mandala-idle-scrollbar::-webkit-scrollbar) {
        width: var(--mandala-idle-scrollbar-size);
        height: var(--mandala-idle-scrollbar-size);
    }

    :global(
            .mandala-idle-scrollbar.is-scrollbar-visible::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card.active-node
                .mandala-idle-scrollbar::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card.node-border--selected
                .mandala-idle-scrollbar::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card:hover .mandala-idle-scrollbar::-webkit-scrollbar-thumb
        ) {
        background: var(--mandala-idle-scrollbar-thumb);
    }

    :global(
            .mandala-idle-scrollbar.is-scrollbar-visible:hover::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card.active-node
                .mandala-idle-scrollbar:hover::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card.node-border--selected
                .mandala-idle-scrollbar:hover::-webkit-scrollbar-thumb
        ),
    :global(
            .mandala-card:hover
                .mandala-idle-scrollbar:hover::-webkit-scrollbar-thumb
        ) {
        background: var(--mandala-idle-scrollbar-thumb-active);
    }

    .mandala-root--week :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .mandala-root--nx9 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .is-editing-mobile.mandala-root {
        height: var(--vvh, 100dvh) !important;
        overflow: hidden !important;
    }
</style>
