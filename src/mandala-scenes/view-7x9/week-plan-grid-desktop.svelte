<script lang="ts">
    import { derived } from 'src/shared/store/derived';
    import type { WeekPlanRow } from 'src/mandala-display/logic/day-plan';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { SectionColorBySectionStore } from 'src/mandala-display/stores/section-colors-store';
    import { PinnedSectionsStore } from 'src/mandala-display/stores/document-derived-stores';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        ShowMandalaDetailSidebarStore,
        WeekPlanCompactModeStore,
        WhiteThemeModeStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { assembleDesktopWeekPlanCells } from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';
    import RowMatrixGridDesktop from 'src/mandala-scenes/view-7x9/row-matrix-grid-desktop.svelte';

    export let rows: WeekPlanRow[] = [];

    const view = getView();
    const weekPlanCompactMode = WeekPlanCompactModeStore(view);
    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const activeCell = derived(
        view.viewStore,
        (state) => state.ui.mandala.activeCellWeek7x9,
    );
    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );
    const selectedNodes = derived(
        view.viewStore,
        (state) => state.document.selectedNodes,
    );
    const pinnedSections = PinnedSectionsStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);

    let cells = [];

    $: cells = assembleDesktopWeekPlanCells({
        rows,
        sectionIdMap: $documentState.sections.section_id,
        activeNodeId: $activeNodeId,
        activeCell: $activeCell,
        editingState: $editingState,
        selectedNodes: $selectedNodes,
        pinnedSections: $pinnedSections,
        sectionColors: $sectionColors,
        sectionColorOpacity: $sectionColorOpacity,
        backgroundMode: $backgroundMode,
        showDetailSidebar: $showDetailSidebar,
        whiteThemeMode: $whiteThemeMode,
    });
</script>

<RowMatrixGridDesktop
    {cells}
    compactMode={$weekPlanCompactMode}
    fontVariable="--mandala-font-7x9"
/>
