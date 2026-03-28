<script lang="ts">
    import { Platform } from 'obsidian';
    import { onDestroy, onMount } from 'svelte';
    import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
    import { derived } from 'src/shared/store/derived';
    import {
        resolveDayPlanTodayNavigation,
        resolveMandalaSceneKey,
        type MandalaSceneKey,
    } from 'src/mandala-display/logic/mandala-profile';
    import {
        getMandalaActiveCellNx9,
        getMandalaActiveCellWeek7x9,
        getMandalaWeekAnchorDate,
    } from 'src/mandala-scenes/shared/scene-runtime';
    import {
        type SceneProjection,
        type ThreeByThreeSceneProjectionProps,
    } from 'src/mandala-scenes/shared/scene-projection';
    import { buildSceneProjection } from 'src/mandala-scenes/shared/scene-projection-adapters';
    import { buildSceneInputSnapshots } from 'src/mandala-scenes/shared/scene-input-runtime';
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
        WeekPlanCompactModeStore,
        WhiteThemeModeStore,
        WeekStartStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { focusContainer } from 'src/stores/view/subscriptions/effects/focus-container';
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
    import { buildMandalaTopologyIndex } from 'src/mandala-display/logic/mandala-topology';
    import {
        buildThreeByThreeSceneProjection,
        buildThreeByThreeSceneProjectionProps,
    } from 'src/mandala-scenes/view-3x3/build-scene-projection';
    import { buildNx9SceneProjectionProps } from 'src/mandala-scenes/view-nx9/build-scene-projection';
    import { buildWeekSceneProjectionProps } from 'src/mandala-scenes/view-7x9/build-scene-projection';
    import {
        buildThreeByThreeCells,
        enterThreeByThreeSubgridFromButton,
        exitThreeByThreeSubgridFromButton,
        focusThreeByThreeTodayFromButton,
        getThreeByThreeDownButtonLabel,
        getThreeByThreeUpButtonLabel,
        handleThreeByThreeMobileCardDoubleClick,
        resolveThreeByThreeTheme,
        syncThreeByThreeSceneState,
    } from 'src/mandala-scenes/view-3x3/scene-state';
    import SceneRuntimeHost from 'src/mandala-scenes/shared/scene-runtime-host.svelte';
    import { createSceneCacheCleaner } from 'src/mandala-scenes/shared/scene-cache-cleanup';
    import { createMobileEditorViewportController } from 'src/mandala-scenes/shared/mobile-editor-viewport';
    import { ensureSceneCompatibility } from 'src/mandala-scenes/shared/scene-compatibility';
    import { createSceneStateSynchronizer } from 'src/mandala-scenes/shared/sync-scene-state';

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
    const weekPlanCompactMode = WeekPlanCompactModeStore(view);
    const weekStart = WeekStartStore(view);

    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const detailSidebarWidth = MandalaDetailSidebarWidthStore(view);
    const squareLayout = SquareLayoutStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const cleanSceneCaches = createSceneCacheCleaner();
    const syncSceneState = createSceneStateSynchronizer();

    const MIN_DESKTOP_DETAIL_SIDEBAR_SIZE = 200;

    let desktopSquareSize = 0;
    let contentWrapperRef: HTMLElement | null = null;
    let contentWrapperObserver: ResizeObserver | null = null;
    let bodyThemeObserver: MutationObserver | null = null;
    let mobilePopupEditorBodyEl: HTMLDivElement | null = null;
    const mobileEditorViewport = createMobileEditorViewportController();
    const mobileViewportHeight = mobileEditorViewport.height;
    const mobileViewportOffsetTop = mobileEditorViewport.offsetTop;
    const mobileViewportBottomInset = mobileEditorViewport.bottomInset;
    const mobileKeyboardOverlayFallback = mobileEditorViewport.keyboardFallback;

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
    const topology = derived(
        view.documentStore,
        (state) => buildMandalaTopologyIndex(state.sections.section_id),
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
        (state) => getMandalaWeekAnchorDate(state),
    );
    const nx9ActiveCell = derived(
        view.viewStore,
        (state) => getMandalaActiveCellNx9(state),
    );
    const weekActiveCell = derived(
        view.viewStore,
        (state) => getMandalaActiveCellWeek7x9(state),
    );
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);
    const hasOpenOverlayModal = derived(view.viewStore, (state) => {
        const controls = state.ui.controls;
        return controls.showHelpSidebar || controls.showSettingsSidebar;
    });

    let containerRef: HTMLElement | null = null;
    onMount(() => {
        const syncNx9ThemeSnapshot = () => {
            const styles = window.getComputedStyle(document.body);
            const inactiveThemeUnderlayColor =
                styles.getPropertyValue('--background-active-parent').trim() ||
                styles.getPropertyValue('--background-primary').trim();
            const activeThemeUnderlayColor =
                styles.getPropertyValue('--background-active-node').trim() ||
                inactiveThemeUnderlayColor;
            const themeSnapshot: MandalaThemeSnapshot = {
                themeTone: document.body.classList.contains('theme-dark')
                    ? 'dark'
                    : 'light',
                themeUnderlayColor: inactiveThemeUnderlayColor,
                activeThemeUnderlayColor,
            };
            nx9ProjectionProps = buildNx9SceneProjectionProps({
                documentSnapshot: sceneInputSnapshots.documentSnapshot,
                themeSnapshot,
                rowsPerPage: $nx9RowsPerPage,
                displaySnapshot: sceneInputSnapshots.displaySnapshot,
                interactionSnapshot: sceneInputSnapshots.interactionSnapshot,
                activeSection,
                activeCoreSection,
                activeCell: $nx9ActiveCell,
            });
        };

        view.container = containerRef;
        focusContainer(view);
        mobileEditorViewport.mount();
        syncNx9ThemeSnapshot();
        bodyThemeObserver = new MutationObserver(syncNx9ThemeSnapshot);
        bodyThemeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });

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
        bodyThemeObserver?.disconnect();
        bodyThemeObserver = null;
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
    let selectedNodesStamp = '';
    let pinnedSectionsStamp = '';
    let preparedDayPlanTodayTargetSection: string | null = null;
    let committedDayPlanTodayTargetSection: string | null = null;
    let sceneKey: MandalaSceneKey = {
        viewKind: '3x3',
        variant: 'default',
    };
    let committedSceneKey: MandalaSceneKey = {
        viewKind: '3x3',
        variant: 'default',
    };
    let sceneProjection: SceneProjection;
    let sceneInputSnapshots: ReturnType<typeof buildSceneInputSnapshots>;
    let shouldRetainCommittedThreeByThreeState = false;
    let preparedThreeByThreeCells = [];
    let committedThreeByThreeCells = [];
    let threeByThreeProjectionProps: ThreeByThreeSceneProjectionProps;
    let committedThreeByThreeProjectionProps: ThreeByThreeSceneProjectionProps;
    let weekProjectionProps = buildWeekSceneProjectionProps({
        frontmatter: '',
        anchorDate: null,
        weekStart: 'monday',
        compactMode: $weekPlanCompactMode,
        displaySnapshot: buildSceneInputSnapshots({
            documentState: $documentState,
            sectionColors: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
            backgroundMode: $backgroundMode,
            showDetailSidebar: $showDetailSidebar,
            whiteThemeMode: $whiteThemeMode,
            activeNodeId: $activeNodeId,
            editingState: $editingState,
            selectedNodes: $selectedNodes,
            selectedStamp: selectedNodesStamp,
            pinnedSections: $pinnedSections,
            pinnedStamp: pinnedSectionsStamp,
        }).displaySnapshot,
    });
    let nx9ProjectionProps = buildNx9SceneProjectionProps({
        documentSnapshot: buildSceneInputSnapshots({
            documentState: $documentState,
            sectionColors: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
            backgroundMode: $backgroundMode,
            showDetailSidebar: $showDetailSidebar,
            whiteThemeMode: $whiteThemeMode,
            activeNodeId: $activeNodeId,
            editingState: $editingState,
            selectedNodes: $selectedNodes,
            selectedStamp: selectedNodesStamp,
            pinnedSections: $pinnedSections,
            pinnedStamp: pinnedSectionsStamp,
        }).documentSnapshot,
        themeSnapshot: {
            themeTone: 'light',
            themeUnderlayColor: '',
            activeThemeUnderlayColor: '',
        },
        rowsPerPage: $nx9RowsPerPage,
        displaySnapshot: buildSceneInputSnapshots({
            documentState: $documentState,
            sectionColors: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
            backgroundMode: $backgroundMode,
            showDetailSidebar: $showDetailSidebar,
            whiteThemeMode: $whiteThemeMode,
            activeNodeId: $activeNodeId,
            editingState: $editingState,
            selectedNodes: $selectedNodes,
            selectedStamp: selectedNodesStamp,
            pinnedSections: $pinnedSections,
            pinnedStamp: pinnedSectionsStamp,
        }).displaySnapshot,
        interactionSnapshot: buildSceneInputSnapshots({
            documentState: $documentState,
            sectionColors: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
            backgroundMode: $backgroundMode,
            showDetailSidebar: $showDetailSidebar,
            whiteThemeMode: $whiteThemeMode,
            activeNodeId: $activeNodeId,
            editingState: $editingState,
            selectedNodes: $selectedNodes,
            selectedStamp: selectedNodesStamp,
            pinnedSections: $pinnedSections,
            pinnedStamp: pinnedSectionsStamp,
        }).interactionSnapshot,
        activeSection,
        activeCoreSection,
        activeCell: $nx9ActiveCell,
    });

    $: sceneKey = resolveMandalaSceneKey({
        frontmatter: $documentState.file.frontmatter,
        viewKind: $mode,
        weekPlanEnabled: view.plugin.settings.getValue().general.weekPlanEnabled,
    });
    $: selectedNodesStamp = Array.from($selectedNodes).sort().join('|');
    $: pinnedSectionsStamp = Array.from($pinnedSections).sort().join('|');
    $: sceneInputSnapshots = buildSceneInputSnapshots({
        documentState: $documentState,
        sectionColors: $sectionColors,
        sectionColorOpacity: $sectionColorOpacity,
        backgroundMode: $backgroundMode,
        showDetailSidebar: $showDetailSidebar,
        whiteThemeMode: $whiteThemeMode,
        activeNodeId: $activeNodeId,
        editingState: $editingState,
        selectedNodes: $selectedNodes,
        selectedStamp: selectedNodesStamp,
        pinnedSections: $pinnedSections,
        pinnedStamp: pinnedSectionsStamp,
    });
    $: weekProjectionProps = buildWeekSceneProjectionProps({
        frontmatter: $documentState.file.frontmatter,
        anchorDate: $weekAnchorDate,
        weekStart: $weekStart,
        compactMode: $weekPlanCompactMode,
        displaySnapshot: sceneInputSnapshots.displaySnapshot,
        sectionIdMap: $documentState.sections.section_id,
        documentContent: $documentState.document.content,
        activeNodeId: $activeNodeId,
        activeCell: $weekActiveCell,
        editingState: $editingState,
        selectedNodes: $selectedNodes,
        pinnedSections: $pinnedSections,
    });
    $: nx9ProjectionProps = buildNx9SceneProjectionProps({
        documentSnapshot: sceneInputSnapshots.documentSnapshot,
        themeSnapshot: nx9ProjectionProps.layoutMeta.themeSnapshot,
        rowsPerPage: $nx9RowsPerPage,
        displaySnapshot: sceneInputSnapshots.displaySnapshot,
        interactionSnapshot: sceneInputSnapshots.interactionSnapshot,
        activeSection,
        activeCoreSection,
        activeCell: $nx9ActiveCell,
    });

    $: {
        ensureSceneCompatibility(view, {
            sceneKey,
            dayPlanEnabled: $dayPlanEnabled,
            subgridTheme: $subgridTheme,
            sectionToNodeId: $sectionToNodeId,
            documentState: $documentState,
        });
    }

    $: {
        cleanSceneCaches(view, committedSceneKey);
        syncSceneState({
            view,
            sceneKey: committedSceneKey,
            dayPlanEnabled: $dayPlanEnabled,
            subgridTheme: $subgridTheme,
            sectionToNodeId: $sectionToNodeId,
            idToSection: $idToSection,
            activeNodeId: $activeNodeId,
            documentState: $documentState,
            selectedLayoutId: $selectedLayoutId,
            customLayouts: $customLayouts,
            nx9RowsPerPage: $nx9RowsPerPage,
            weekAnchorDate: $weekAnchorDate,
            weekStart: $weekStart,
        });
        view.flushSceneSyncTrace({
            mode: committedSceneKey.viewKind,
        });
    }

    $: preparedDayPlanTodayTargetSection =
        sceneKey.viewKind === '3x3'
            ? resolveDayPlanTodayNavigation($documentState.file.frontmatter)
                  .targetSection
            : null;
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
    $: preparedThreeByThreeCells =
        sceneKey.viewKind === '3x3'
            ? buildThreeByThreeCells({
                  theme: threeByThreeTheme,
                  selectedLayoutId: $selectedLayoutId,
                  customLayouts: $customLayouts,
                  topology: $topology,
                  interaction: sceneInputSnapshots.interactionSnapshot,
                  displaySnapshot: sceneInputSnapshots.displaySnapshot,
              })
            : [];
    $: if (committedSceneKey.viewKind === '3x3') {
        committedDayPlanTodayTargetSection = syncThreeByThreeSceneState({
            view,
            mode: committedSceneKey.viewKind,
            subgridTheme: $subgridTheme,
            documentState: $documentState,
            sectionToNodeId: $sectionToNodeId,
        });
        committedThreeByThreeCells = buildThreeByThreeCells({
            theme: threeByThreeTheme,
            selectedLayoutId: $selectedLayoutId,
            customLayouts: $customLayouts,
            topology: $topology,
            interaction: sceneInputSnapshots.interactionSnapshot,
            displaySnapshot: sceneInputSnapshots.displaySnapshot,
        });
    }
    $: shouldRetainCommittedThreeByThreeState =
        committedSceneKey.viewKind === '3x3' || sceneKey.viewKind === '3x3';
    $: if (
        !shouldRetainCommittedThreeByThreeState &&
        committedThreeByThreeCells.length
    ) {
        committedThreeByThreeCells = [];
    }
    $: if (
        !shouldRetainCommittedThreeByThreeState &&
        committedDayPlanTodayTargetSection
    ) {
        committedDayPlanTodayTargetSection = null;
    }
    $: threeByThreeProjectionProps = buildThreeByThreeSceneProjectionProps({
        cells: preparedThreeByThreeCells,
        theme: threeByThreeTheme,
        animateSwap: $swapState.animate,
        show3x3SubgridNavButtons: $show3x3SubgridNavButtons,
        hasOpenOverlayModal: $hasOpenOverlayModal,
        dayPlanEnabled: $dayPlanEnabled,
        showDayPlanTodayButton: $showDayPlanTodayButton,
        dayPlanTodayTargetSection: preparedDayPlanTodayTargetSection,
        activeCoreSection,
        enterSubgridFromButton: (event: MouseEvent, nodeId: string) =>
            enterThreeByThreeSubgridFromButton(view, event, nodeId),
        exitSubgridFromButton: (event: MouseEvent) =>
            exitThreeByThreeSubgridFromButton(view, event),
        focusDayPlanTodayFromButton: (event: MouseEvent) =>
            focusThreeByThreeTodayFromButton(view, event),
        onMobileCardDoubleClick: ({ nodeId, displaySection, event }) =>
            handleThreeByThreeMobileCardDoubleClick(
                view,
                event,
                nodeId,
                displaySection,
            ),
        getUpButtonLabel: getThreeByThreeUpButtonLabel,
        getDownButtonLabel: getThreeByThreeDownButtonLabel,
    });
    $: committedThreeByThreeProjectionProps =
        buildThreeByThreeSceneProjectionProps({
        cells: committedThreeByThreeCells,
        theme: threeByThreeTheme,
        animateSwap: $swapState.animate,
        show3x3SubgridNavButtons: $show3x3SubgridNavButtons,
        hasOpenOverlayModal: $hasOpenOverlayModal,
        dayPlanEnabled: $dayPlanEnabled,
        showDayPlanTodayButton: $showDayPlanTodayButton,
        dayPlanTodayTargetSection: committedDayPlanTodayTargetSection,
        activeCoreSection,
        enterSubgridFromButton: (event: MouseEvent, nodeId: string) =>
            enterThreeByThreeSubgridFromButton(view, event, nodeId),
        exitSubgridFromButton: (event: MouseEvent) =>
            exitThreeByThreeSubgridFromButton(view, event),
        focusDayPlanTodayFromButton: (event: MouseEvent) =>
            focusThreeByThreeTodayFromButton(view, event),
        onMobileCardDoubleClick: ({ nodeId, displaySection, event }) =>
            handleThreeByThreeMobileCardDoubleClick(
                view,
                event,
                nodeId,
                displaySection,
            ),
        getUpButtonLabel: getThreeByThreeUpButtonLabel,
        getDownButtonLabel: getThreeByThreeDownButtonLabel,
    });
    $: sceneProjection =
        sceneKey.viewKind === '3x3'
            ? buildThreeByThreeSceneProjection({
                  sceneKey,
                  committedSceneKey,
                  preparedProps: threeByThreeProjectionProps,
                  committedProps: committedThreeByThreeProjectionProps,
              })
            : buildSceneProjection({
                  sceneKey,
                  committedSceneKey,
                  preparedThreeByThreeProps: threeByThreeProjectionProps,
                  committedThreeByThreeProps: committedThreeByThreeProjectionProps,
                  weekProps: weekProjectionProps,
                  nx9Props: nx9ProjectionProps,
              });
</script>

<div
    class="mandala-root"
    class:mandala-root--3={committedSceneKey.viewKind === '3x3'}
    class:mandala-root--9={committedSceneKey.viewKind === '9x9'}
    class:mandala-root--nx9={committedSceneKey.viewKind === 'nx9'}
    class:mandala-root--week={committedSceneKey.variant === 'week-7x9'}
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
                <SceneRuntimeHost
                    sceneKey={sceneKey}
                    projection={sceneProjection}
                    bind:committedSceneKey
                />
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
        overflow-y: auto;
        overflow-x: hidden;
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
        overflow-y: auto;
        overflow-x: hidden;
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
        --mandala-card-overflow: visible;
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

    .is-editing-mobile.mandala-root {
        height: var(--vvh, 100dvh) !important;
        overflow: hidden !important;
    }
</style>
