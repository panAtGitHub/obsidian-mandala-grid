<script lang="ts">
    import { Platform } from 'obsidian';
    import { CalendarDays } from 'lucide-svelte';
    import { onDestroy, onMount } from 'svelte';
    import { derived } from 'src/lib/store/derived';
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
    } from 'src/stores/settings/derived/view-settings-store';
    import { getView } from 'src/views/shared/shell/context';
    import MandalaCard from 'src/cell/display/components/mandala-card.svelte';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
    import {
        getMandalaLayoutById,
        posOfSection9x9,
        sectionAtCell9x9,
    } from 'src/view/helpers/mandala/mandala-grid';
    import { setActiveCell9x9 } from 'src/helpers/views/mandala/set-active-cell-9x9';
    import MandalaOverviewSimple from 'src/views/view-9x9/mandala-overview-simple.svelte';
    import { flip } from 'svelte/animate';
    import VerticalToolbar from 'src/ui/toolbar/vertical/vertical-toolbar.svelte';
    import Toolbar from 'src/ui/toolbar/main/toolbar.svelte';
    import ToolbarCenter from 'src/ui/toolbar/main/toolbar-center.svelte';
    import MandalaDetailSidebar from 'src/ui/sidebar/mandala-detail-sidebar.svelte';
    import { createLayoutStore } from 'src/stores/view/orientation-store';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import MobileFullScreenSearch from 'src/ui/modals/mobile-fullscreen-search.svelte';
    import MobileNativeEditorSheet from 'src/ui/modals/mobile-native-editor-sheet.svelte';
    import { mobilePopupFontSizeStore } from 'src/stores/mobile-popup-font-store';
    import { SectionColorBySectionStore } from 'src/stores/cell/section-colors-store';
    import { PinnedSectionsStore } from 'src/stores/cell/document-derived-stores';
    import { resolveCustomSectionColor } from 'src/lib/mandala/section-colors';
    import { findChildGroup } from 'src/lib/tree-utils/find/find-child-group';
    import {
        enterSubgridForNode,
        exitCurrentSubgrid,
    } from 'src/helpers/views/mandala/mobile-navigation';
    import MandalaNavIcon from 'src/views/shared/mandala-nav-icon.svelte';
    import { parseDayPlanFrontmatter } from 'src/lib/mandala/day-plan';
    import { resolveDayPlanTodayNavigation } from 'src/lib/mandala/mandala-profile';
    import { lang } from 'src/lang/lang';
    import MandalaNx9 from 'src/views/view-nx9/mandala-nx9.svelte';
    import MandalaWeek7x9 from 'src/views/view-7x9/mandala-week-7x9.svelte';
    import {
        normalizeNx9VisibleSection,
        resolveNx9Context,
    } from 'src/view/helpers/mandala/nx9/context';
    import { setActiveCellNx9 } from 'src/view/helpers/mandala/nx9/set-active-cell';
    import { setActiveCellWeek7x9 } from 'src/helpers/views/mandala/set-active-cell-week-7x9';
    import { resolveWeekPlanContext } from 'src/lib/mandala/week-plan-context';

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

    const isCrossPosition = (row: number, col: number) =>
        (row === 0 && col === 1) ||
        (row === 1 && col === 0) ||
        (row === 1 && col === 2) ||
        (row === 2 && col === 1);

    const isCrossIndex = (index: number) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        return isCrossPosition(row, col);
    };
    const getSectionBackground = (
        section: string,
        index: number,
        backgroundMode: string,
        sectionColors: Record<string, string>,
        sectionColorOpacity: number,
    ) => {
        const customColor = resolveCustomSectionColor({
            section,
            backgroundMode,
            sectionColorsBySection: sectionColors,
            sectionColorOpacity,
        });
        if (customColor) return customColor;
        if (backgroundMode === 'gray' && isCrossIndex(index)) {
            return `color-mix(in srgb, var(--mandala-gray-block-base) ${sectionColorOpacity}%, transparent)`;
        }
        return null;
    };

    const getBaseTheme = (section: string | undefined) =>
        section ? section.split('.')[0] : '1';

    const MIN_DESKTOP_DETAIL_SIDEBAR_SIZE = 200;

    let desktopSquareSize = 0;
    let contentWrapperRef: HTMLElement | null = null;
    let contentWrapperObserver: ResizeObserver | null = null;
    let mobilePopupEditorBodyEl: HTMLDivElement | null = null;
    let visualViewportHeight = 0;
    let visualViewportOffsetTop = 0;
    let visualViewportBottomInset = 0;
    let keyboardOverlayFallback = 0;
    let isMobileEditorFocused = false;
    let mobileCursorGuardCleanup: (() => void) | null = null;

    const updateVisualViewport = () => {
        const vv = window.visualViewport;
        if (!vv) {
            visualViewportHeight = window.innerHeight;
            visualViewportOffsetTop = 0;
            visualViewportBottomInset = 0;
            keyboardOverlayFallback = isMobileEditorFocused ? 280 : 0;
            return;
        }
        visualViewportHeight = vv.height;
        visualViewportOffsetTop = vv.offsetTop;
        visualViewportBottomInset = Math.max(
            0,
            window.innerHeight - vv.height - vv.offsetTop,
        );
        // 部分输入法扩展面板不会反映在 visualViewport，焦点态下给一个兜底底部留白
        const viewportReportedKeyboard =
            visualViewportBottomInset > 40 ||
            window.innerHeight - visualViewportHeight > 100;
        keyboardOverlayFallback =
            isMobileEditorFocused && !viewportReportedKeyboard ? 280 : 0;
    };

    const handleMobileEditorFocusIn = () => {
        isMobileEditorFocused = true;
        updateVisualViewport();
    };

    const handleMobileEditorFocusOut = () => {
        window.setTimeout(() => {
            isMobileEditorFocused = Boolean(
                mobilePopupEditorBodyEl?.contains(document.activeElement),
            );
            updateVisualViewport();
        }, 0);
    };

    const getActiveCursorRect = (): DOMRect | null => {
        if (!mobilePopupEditorBodyEl) return null;
        const cursor = mobilePopupEditorBodyEl.querySelector(
            '.cm-cursorLayer .cm-cursor',
        ) as HTMLElement | null;
        if (cursor) return cursor.getBoundingClientRect();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;
        return selection.getRangeAt(0).getBoundingClientRect();
    };

    const hasActiveRangeSelectionInMobileEditor = () => {
        if (!mobilePopupEditorBodyEl) return false;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            return false;
        }
        const anchorNode = selection.anchorNode;
        const focusNode = selection.focusNode;
        return Boolean(
            anchorNode &&
                focusNode &&
                mobilePopupEditorBodyEl.contains(anchorNode) &&
                mobilePopupEditorBodyEl.contains(focusNode),
        );
    };

    const ensureMobileCursorVisible = () => {
        if (!isMobilePopupEditing || !mobilePopupEditorBodyEl) return;
        if (hasActiveRangeSelectionInMobileEditor()) return;
        const scroller = mobilePopupEditorBodyEl.querySelector(
            '.cm-editor .cm-scroller',
        ) as HTMLElement | null;
        if (!scroller) return;
        const cursorRect = getActiveCursorRect();
        if (!cursorRect) return;
        const vv = window.visualViewport;
        const visibleTop = vv ? vv.offsetTop : 0;
        const visibleBottom = vv
            ? vv.offsetTop + vv.height
            : window.innerHeight;
        const topLimit = visibleTop + 8;
        const bottomLimit = visibleBottom - 12;
        if (cursorRect.bottom > bottomLimit) {
            scroller.scrollTop += cursorRect.bottom - bottomLimit;
        } else if (cursorRect.top < topLimit) {
            scroller.scrollTop -= topLimit - cursorRect.top;
        }
    };

    const scheduleEnsureMobileCursorVisible = () => {
        window.requestAnimationFrame(() => {
            ensureMobileCursorVisible();
            window.setTimeout(() => {
                ensureMobileCursorVisible();
            }, 24);
        });
    };

    const setupMobileCursorGuard = () => {
        if (!mobilePopupEditorBodyEl) return () => {};
        const onEditorActivity = () => {
            updateVisualViewport();
            scheduleEnsureMobileCursorVisible();
        };
        mobilePopupEditorBodyEl.addEventListener('input', onEditorActivity);
        mobilePopupEditorBodyEl.addEventListener('keyup', onEditorActivity);
        mobilePopupEditorBodyEl.addEventListener(
            'compositionend',
            onEditorActivity,
        );
        mobilePopupEditorBodyEl.addEventListener('touchend', onEditorActivity);
        mobilePopupEditorBodyEl.addEventListener('click', onEditorActivity);
        document.addEventListener('selectionchange', onEditorActivity);
        window.visualViewport?.addEventListener('resize', onEditorActivity);
        window.visualViewport?.addEventListener('scroll', onEditorActivity);
        scheduleEnsureMobileCursorVisible();
        return () => {
            mobilePopupEditorBodyEl?.removeEventListener(
                'input',
                onEditorActivity,
            );
            mobilePopupEditorBodyEl?.removeEventListener(
                'keyup',
                onEditorActivity,
            );
            mobilePopupEditorBodyEl?.removeEventListener(
                'compositionend',
                onEditorActivity,
            );
            mobilePopupEditorBodyEl?.removeEventListener(
                'touchend',
                onEditorActivity,
            );
            mobilePopupEditorBodyEl?.removeEventListener(
                'click',
                onEditorActivity,
            );
            document.removeEventListener('selectionchange', onEditorActivity);
            window.visualViewport?.removeEventListener(
                'resize',
                onEditorActivity,
            );
            window.visualViewport?.removeEventListener(
                'scroll',
                onEditorActivity,
            );
        };
    };

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
        updateVisualViewport();
        window.visualViewport?.addEventListener('resize', updateVisualViewport);
        window.visualViewport?.addEventListener('scroll', updateVisualViewport);
        window.addEventListener('orientationchange', updateVisualViewport);

        contentWrapperObserver = new ResizeObserver(() => {
            recomputeDesktopSquareSize();
        });
        if (contentWrapperRef) {
            contentWrapperObserver.observe(contentWrapperRef);
        }
        recomputeDesktopSquareSize();
    });

    onDestroy(() => {
        mobileCursorGuardCleanup?.();
        mobileCursorGuardCleanup = null;
        window.visualViewport?.removeEventListener(
            'resize',
            updateVisualViewport,
        );
        window.visualViewport?.removeEventListener(
            'scroll',
            updateVisualViewport,
        );
        window.removeEventListener('orientationchange', updateVisualViewport);
        contentWrapperObserver?.disconnect();
        contentWrapperObserver = null;
    });

    $: {
        if (!isMobilePopupEditing || !mobilePopupEditorBodyEl) {
            mobileCursorGuardCleanup?.();
            mobileCursorGuardCleanup = null;
        } else if (!mobileCursorGuardCleanup) {
            mobileCursorGuardCleanup = setupMobileCursorGuard();
        }
    }

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

    $: {
        const dayPlan = getCachedDayPlan($documentState.file.frontmatter);
        const todayNavigation = resolveDayPlanTodayNavigation(
            $documentState.file.frontmatter,
        );
        dayPlanTodayTargetSection = todayNavigation.targetSection;
        const allowSubgridExpansion = !(
            dayPlan &&
            dayPlan.daily_only_3x3 &&
            $subgridTheme?.includes('.')
        );
        if (
            allowSubgridExpansion &&
            $mode === '3x3' &&
            $subgridTheme &&
            !$subgridTheme.includes('.') &&
            $documentState.meta.isMandala
        ) {
            const themeNodeId = $sectionToNodeId[$subgridTheme];
            if (themeNodeId) {
                const childGroup = findChildGroup(
                    $documentState.document.columns,
                    themeNodeId,
                );
                const childCount = childGroup?.nodes.length ?? 0;
                if (childCount < 8) {
                    view.documentStore.dispatch({
                        type: 'document/mandala/ensure-children',
                        payload: { parentNodeId: themeNodeId, count: 8 },
                    });
                }
            }
        }
    }
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

    const enterSubgridFromButton = (event: MouseEvent, nodeId: string) => {
        event.stopPropagation();
        enterSubgridForNode(view, nodeId);
    };

    const exitSubgridFromButton = (event: MouseEvent) => {
        event.stopPropagation();
        exitCurrentSubgrid(view);
    };

    const getUpButtonLabel = (theme: string) =>
        theme.includes('.') ? '退出上一层子九宫格' : '上一层核心九宫格';

    const getDownButtonLabel = (theme: string) =>
        theme.includes('.') ? '进入下一层子九宫格' : '下一层核心九宫格';

    const focusDayPlanTodayFromButton = (event: MouseEvent) => {
        event.stopPropagation();
        view.focusDayPlanToday();
    };
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
        'var(--mandala-color-selection)'}; --mandala-grid-highlight-width: {$gridHighlightWidth}px; --vvh: {visualViewportHeight ||
        window.innerHeight}px; --vvo: {visualViewportOffsetTop}px; --vvb: {visualViewportBottomInset}px; --vkf: {keyboardOverlayFallback}px;"
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
                    {@const theme = $subgridTheme ?? '1'}
                    {@const layout = getMandalaLayoutById(
                        $selectedLayoutId,
                        $customLayouts,
                    )}
                    {@const sections = layout.childSlots.map((slot) =>
                        slot ? `${theme}.${slot}` : theme,
                    )}
                    {@const cells = sections.map((section, index) => {
                        const nodeId = requireNodeId(section);
                        return {
                            section,
                            index,
                            nodeId,
                            key: section,
                        };
                    })}
                    <div
                        class="mandala-grid mandala-grid--3 mandala-grid--core"
                    >
                        {#each cells as cell (cell.key)}
                            {@const sectionBackground = getSectionBackground(
                                cell.section,
                                cell.index,
                                $backgroundMode,
                                $sectionColors,
                                $sectionColorOpacity,
                            )}
                            <div
                                class="mandala-cell"
                                animate:flip={{
                                    duration: $swapState.animate ? 220 : 0,
                                }}
                            >
                                {#if cell.nodeId}
                                    <MandalaCard
                                        nodeId={cell.nodeId}
                                        section={cell.section}
                                        active={cell.nodeId === $activeNodeId}
                                        preserveActiveBackground={$whiteThemeMode}
                                        sectionIndicatorVariant={!$whiteThemeMode
                                            ? 'section-capsule'
                                            : 'plain-with-pin'}
                                        editing={$editingState.activeNodeId ===
                                            cell.nodeId &&
                                            !$editingState.isInSidebar &&
                                            !$showDetailSidebar}
                                        selected={$selectedNodes.has(
                                            cell.nodeId,
                                        )}
                                        pinned={$pinnedSections.has(
                                            cell.section,
                                        )}
                                        sectionColor={sectionBackground}
                                    />
                                    {#if !Platform.isMobile && $show3x3SubgridNavButtons && !$hasOpenOverlayModal}
                                        <div
                                            class="mandala-subgrid-controls"
                                            class:is-center-controls={cell.section ===
                                                theme}
                                            on:click|stopPropagation
                                            on:mousedown|stopPropagation|preventDefault
                                            on:pointerdown|stopPropagation|preventDefault
                                        >
                                            {#if cell.section === theme}
                                                {#if theme !== '1'}
                                                    <button
                                                        class="mandala-subgrid-btn mandala-subgrid-btn--up"
                                                        type="button"
                                                        aria-label={getUpButtonLabel(
                                                            theme,
                                                        )}
                                                        title={getUpButtonLabel(
                                                            theme,
                                                        )}
                                                        on:click={(event) =>
                                                            exitSubgridFromButton(
                                                                event,
                                                            )}
                                                    >
                                                        <span
                                                            class="mandala-subgrid-btn__icon"
                                                        >
                                                            {#if theme.includes('.')}
                                                                <MandalaNavIcon
                                                                    direction="up"
                                                                    size={14}
                                                                    strokeWidth={2.2}
                                                                />
                                                            {:else}
                                                                <MandalaNavIcon
                                                                    direction="left"
                                                                    size={14}
                                                                    strokeWidth={2.2}
                                                                />
                                                            {/if}
                                                        </span>
                                                    </button>
                                                {/if}
                                                {#if !theme.includes('.')}
                                                    <button
                                                        class="mandala-subgrid-btn mandala-subgrid-btn--down"
                                                        type="button"
                                                        aria-label={getDownButtonLabel(
                                                            theme,
                                                        )}
                                                        title={getDownButtonLabel(
                                                            theme,
                                                        )}
                                                        on:click={(event) =>
                                                            enterSubgridFromButton(
                                                                event,
                                                                cell.nodeId,
                                                            )}
                                                    >
                                                        <span
                                                            class="mandala-subgrid-btn__icon"
                                                        >
                                                            {#if theme.includes('.')}
                                                                <MandalaNavIcon
                                                                    direction="down"
                                                                    size={14}
                                                                    strokeWidth={2.2}
                                                                />
                                                            {:else}
                                                                <MandalaNavIcon
                                                                    direction="right"
                                                                    size={14}
                                                                    strokeWidth={2.2}
                                                                />
                                                            {/if}
                                                        </span>
                                                    </button>
                                                {/if}
                                                {#if $dayPlanEnabled && $showDayPlanTodayButton && dayPlanTodayTargetSection && activeCoreSection !== dayPlanTodayTargetSection}
                                                    <button
                                                        class="mandala-subgrid-btn mandala-subgrid-btn--today"
                                                        type="button"
                                                        aria-label={lang.day_plan_today_button_label}
                                                        title={lang.day_plan_today_button_label}
                                                        on:click={(event) =>
                                                            focusDayPlanTodayFromButton(
                                                                event,
                                                            )}
                                                    >
                                                        <span
                                                            class="mandala-subgrid-btn__icon"
                                                        >
                                                            <CalendarDays
                                                                size={14}
                                                                strokeWidth={2.2}
                                                            />
                                                        </span>
                                                    </button>
                                                {/if}
                                            {:else}
                                                <button
                                                    class="mandala-subgrid-btn mandala-subgrid-btn--single"
                                                    type="button"
                                                    aria-label="进入子九宫"
                                                    on:click={(event) =>
                                                        enterSubgridFromButton(
                                                            event,
                                                            cell.nodeId,
                                                        )}
                                                >
                                                    <span
                                                        class="mandala-subgrid-btn__icon"
                                                    >
                                                        <MandalaNavIcon
                                                            direction="down"
                                                            size={14}
                                                            strokeWidth={2.2}
                                                        />
                                                    </span>
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                {:else}
                                    <div
                                        class="mandala-empty"
                                        style={sectionBackground
                                            ? `background-color: ${sectionBackground};`
                                            : undefined}
                                    >
                                        {cell.section}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {:else if $mode === '9x9'}
                    <MandalaOverviewSimple />
                {:else if $mode === 'nx9'}
                    <MandalaNx9 />
                {:else}
                    <MandalaWeek7x9 />
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

    .mandala-a4-mode.is-desktop-square-layout .mandala-grid--core {
        width: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
        height: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
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

    .mandala-grid {
        display: grid;
        grid-template-columns: repeat(3, var(--node-width));
        gap: var(--mandala-gap);
        align-items: start;
    }

    .mandala-cell {
        width: 100%;
        height: 100%;
        position: relative;
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

    .mandala-white-theme .mandala-grid--core {
        gap: 0;
        box-sizing: border-box;
    }

    .mandala-white-theme .mandala-cell {
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        box-sizing: border-box;
        overflow: hidden;
    }

    .mandala-white-theme .mandala-cell:nth-child(-n + 3) {
        border-top: 3px solid var(--mandala-border-color);
    }

    .mandala-white-theme .mandala-cell:nth-child(3n + 1) {
        border-left: 3px solid var(--mandala-border-color);
    }

    .mandala-white-theme .mandala-cell:nth-child(n + 7) {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    .mandala-white-theme .mandala-cell:nth-child(3n) {
        border-right: 3px solid var(--mandala-border-color);
    }

    .mandala-white-theme .mandala-cell :global(.mandala-card) {
        border: 0 !important;
        border-left-width: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
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

    .mandala-root--3 .mandala-empty {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-root--week .mandala-empty {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-root--nx9 .mandala-empty {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-subgrid-controls {
        position: absolute;
        right: 8px;
        bottom: 8px;
        z-index: 20;
        display: flex;
        gap: 6px;
        pointer-events: auto;
    }

    .mandala-subgrid-controls.is-center-controls {
        left: 8px;
        right: 8px;
        bottom: 8px;
        display: block;
    }

    .mandala-subgrid-btn {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        box-shadow: var(--shadow-s);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        position: relative;
        z-index: 21;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            box-shadow 120ms ease,
            transform 120ms ease;
    }

    .mandala-subgrid-btn:hover {
        background: color-mix(
            in srgb,
            var(--background-primary-alt) 75%,
            var(--interactive-accent) 25%
        );
        border-color: color-mix(
            in srgb,
            var(--interactive-accent) 55%,
            var(--background-modifier-border) 45%
        );
        box-shadow:
            0 0 0 1px
                color-mix(in srgb, var(--interactive-accent) 45%, transparent),
            var(--shadow-s);
        transform: translateY(-1px);
    }

    .mandala-subgrid-btn:active {
        transform: translateY(1px);
    }

    .mandala-subgrid-btn__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        line-height: 0;
    }

    .mandala-subgrid-btn__icon :global(svg),
    .mandala-subgrid-btn__icon :global(.svg-icon) {
        display: block;
        width: 14px !important;
        height: 14px !important;
        stroke-width: 2.2 !important;
    }

    .mandala-subgrid-controls.is-center-controls .mandala-subgrid-btn--up {
        position: absolute;
        left: 0;
        bottom: 0;
    }

    .mandala-subgrid-controls.is-center-controls .mandala-subgrid-btn--down {
        position: absolute;
        right: 0;
        bottom: 0;
    }

    .mandala-subgrid-controls.is-center-controls .mandala-subgrid-btn--today {
        position: absolute;
        left: calc(50% - 12px);
        bottom: 0;
    }

    /* 9×9：格子约等于 3×3 的 1/3，并铺满屏幕 */
    .mandala-root--9 {
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-min-height: 0px;
        --mandala-card-overflow: hidden;
    }

    .mandala-root--9 .mandala-grid {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        align-items: stretch;
    }

    .mandala-root--9 .mandala-empty {
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    .mandala-root--9 .mandala-grid :global(.lng-prev),
    .mandala-root--9 :global(.mandala-raw9-preview .lng-prev) {
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

    /* 3×3：内容超出时在格子内部滚动（避免撑开格子） */
    .mandala-root--3 .mandala-grid :global(.lng-prev),
    .mandala-root--3 :global(.mandala-raw9-preview .lng-prev) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
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

    .mandala-root--3 :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
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

    .mandala-empty {
        width: var(--node-width);
        min-height: var(--min-node-height);
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        padding: 8px;
        opacity: 0.7;
        position: relative;
        background: var(--background-primary);
    }

    .is-editing-mobile.mandala-root {
        height: var(--vvh, 100dvh) !important;
        overflow: hidden !important;
    }
</style>
