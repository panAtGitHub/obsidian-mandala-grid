<script lang="ts">
    import { Platform } from 'obsidian';
    import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
    import { derived } from 'src/shared/store/derived';
    import {
        DayPlanEnabledStore,
        MandalaA4ModeStore,
        MandalaA4OrientationStore,
        MandalaBackgroundModeStore,
        MandalaBorderOpacityStore,
        MandalaDetailSidebarWidthStore,
        MandalaGridCustomLayoutsStore,
        MandalaGridHighlightColorStore,
        MandalaGridHighlightWidthStore,
        MandalaGridSelectedLayoutIdStore,
        MandalaModeStore,
        MandalaSectionColorOpacityStore,
        Nx9RowsPerPageStore,
        Show3x3SubgridNavButtonsStore,
        ShowDayPlanTodayButtonStore,
        ShowMandalaDetailSidebarStore,
        SquareLayoutStore,
        WeekPlanCompactModeStore,
        WeekStartStore,
        WhiteThemeModeStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { createLayoutStore } from 'src/stores/view/orientation-store';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import { SectionColorBySectionStore } from 'src/mandala-display/stores/section-colors-store';
    import { PinnedSectionsSnapshotStore } from 'src/mandala-display/stores/document-derived-stores';
    import { selectedNodesSnapshotStore } from 'src/stores/view/derived/selected-nodes-store';
    import { getMandalaActiveCellNx9, getMandalaWeekAnchorDate } from 'src/mandala-scenes/shared/scene-runtime';
    import RootShell from 'src/mandala-scenes/shared/root-shell.svelte';
    import { createSceneRootController } from 'src/mandala-scenes/shared/root-controller';
    import { mobilePopupFontSizeStore } from 'src/stores/ui/mobile-popup-font-store';

    const view = getView();
    const layout = createLayoutStore();
    const search = searchStore(view);
    const rootController = createSceneRootController(view);
    const DEFAULT_THEME_SNAPSHOT: MandalaThemeSnapshot = {
        themeTone: 'light',
        themeUnderlayColor: '',
        activeThemeUnderlayColor: '',
    };

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
    const documentState = derived(view.documentStore, (state) => state);
    const selectedNodesSnapshot = selectedNodesSnapshotStore(view);
    const pinnedSectionsSnapshot = PinnedSectionsSnapshotStore(view);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );
    const subgridTheme = derived(
        view.viewStore,
        (state) => state.ui.mandala.subgridTheme,
    );
    const weekAnchorDate = derived(view.viewStore, (state) =>
        getMandalaWeekAnchorDate(state),
    );
    const nx9ActiveCell = derived(view.viewStore, (state) =>
        getMandalaActiveCellNx9(state),
    );
    const swapState = derived(view.viewStore, (state) => state.ui.mandala.swap);
    const hasOpenOverlayModal = derived(view.viewStore, (state) => {
        const controls = state.ui.controls;
        return controls.showHelpSidebar || controls.showSettingsSidebar;
    });

    let sceneThemeSnapshot: MandalaThemeSnapshot = DEFAULT_THEME_SNAPSHOT;
    let desktopSquareSize = 0;
    let committedSceneKey = {
        viewKind: '3x3',
        variant: 'default',
    } as const;
    let sceneRootContext: ReturnType<typeof rootController.buildContext>;
    let sceneProjection: ReturnType<typeof rootController.resolveProjection>;

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

    const handleMobileEditorFocusIn = () => undefined;
    const handleMobileEditorFocusOut = () => undefined;

    $: {
        sceneRootContext = rootController.buildContext({
            documentState: $documentState,
            sceneThemeSnapshot,
            committedSceneKey,
            activeNodeId: $activeNodeId,
            editingState: $editingState,
            selectedNodes: $selectedNodesSnapshot.selectedNodes,
            selectedStamp: $selectedNodesSnapshot.stamp,
            pinnedSections: $pinnedSectionsSnapshot.sections,
            pinnedStamp: $pinnedSectionsSnapshot.stamp,
            sectionColors: $sectionColors,
            sectionColorOpacity: $sectionColorOpacity,
            backgroundMode: $backgroundMode,
            showDetailSidebar: $showDetailSidebar,
            whiteThemeMode: $whiteThemeMode,
            subgridTheme: $subgridTheme,
            nx9ActiveCell: $nx9ActiveCell,
            weekAnchorDate: $weekAnchorDate,
            selectedLayoutId: $selectedLayoutId,
            customLayouts: $customLayouts,
            nx9RowsPerPage: $nx9RowsPerPage,
            weekPlanCompactMode: $weekPlanCompactMode,
            weekStart: $weekStart,
            dayPlanEnabled: $dayPlanEnabled,
            showDayPlanTodayButton: $showDayPlanTodayButton,
            show3x3SubgridNavButtons: $show3x3SubgridNavButtons,
            hasOpenOverlayModal: $hasOpenOverlayModal,
            animateSwap: $swapState.animate,
            desktopSquareSize,
            isMobilePopupEditing: false,
            isMobileFullScreenSearch: Platform.isMobile && $search.showInput,
            mode: $mode,
        });
        sceneProjection = rootController.resolveProjection(sceneRootContext);
    }
</script>

<RootShell
    sceneKey={sceneRootContext.sceneKey}
    bind:committedSceneKey
    projection={sceneProjection}
    squareSize={$layout.squareSize}
    isPortrait={$layout.isPortrait}
    showDetailSidebar={$showDetailSidebar}
    detailSidebarWidth={$detailSidebarWidth}
    squareLayout={$squareLayout}
    whiteThemeMode={$whiteThemeMode}
    a4Mode={$a4Mode}
    a4Orientation={$a4Orientation}
    borderOpacity={$borderOpacity}
    gridHighlightColor={$gridHighlightColor}
    gridHighlightWidth={$gridHighlightWidth}
    isMobilePopupEditing={false}
    isMobileFullScreenSearch={Platform.isMobile && $search.showInput}
    editingState={$editingState}
    mobilePopupFontSize={$mobilePopupFontSizeStore}
    onSave={handleSave}
    onIncreaseFontSize={handleIncreaseFontSize}
    onDecreaseFontSize={handleDecreaseFontSize}
    onMobileEditorFocusIn={handleMobileEditorFocusIn}
    onMobileEditorFocusOut={handleMobileEditorFocusOut}
    bind:sceneThemeSnapshot
    bind:desktopSquareSize
/>
