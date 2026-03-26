<script lang="ts">
    import { derived } from 'src/shared/store/derived';
    import type { WeekPlanRow } from 'src/mandala-display/logic/day-plan';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { PinnedSectionsStore } from 'src/mandala-display/stores/document-derived-stores';
    import { assembleDesktopWeekPlanCells } from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';
    import RowMatrixGridDesktop from 'src/mandala-scenes/view-7x9/row-matrix-grid-desktop.svelte';
    import { getMandalaActiveCellWeek7x9 } from 'src/mandala-scenes/shared/scene-runtime';

    export let rows: WeekPlanRow[] = [];
    export let compactMode = false;
    export let sectionColors: Record<string, string> = {};
    export let sectionColorOpacity = 0;
    export let backgroundMode = 'none';
    export let showDetailSidebar = false;
    export let whiteThemeMode = false;

    const view = getView();
    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const activeCell = derived(
        view.viewStore,
        (state) => getMandalaActiveCellWeek7x9(state),
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

    let cells = [];

    $: cells = assembleDesktopWeekPlanCells({
        rows,
        sectionIdMap: $documentState.sections.section_id,
        activeNodeId: $activeNodeId,
        activeCell: $activeCell,
        compactMode,
        editingState: $editingState,
        selectedNodes: $selectedNodes,
        pinnedSections: $pinnedSections,
        sectionColors,
        sectionColorOpacity,
        backgroundMode,
        showDetailSidebar,
        whiteThemeMode,
    });
</script>

<RowMatrixGridDesktop
    {cells}
    {compactMode}
    fontVariable="--mandala-font-7x9"
/>
