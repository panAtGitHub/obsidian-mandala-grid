<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        Nx9RowsPerPageStore,
        ShowMandalaDetailSidebarStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { SectionColorBySectionStore } from 'src/stores/cell/section-colors-store';
    import { PinnedSectionsStore } from 'src/stores/cell/document-derived-stores';
    import { getView } from 'src/views/shared/shell/context';
    import { resolveNx9Context } from 'src/view/helpers/mandala/nx9/context';
    import { setActiveCellNx9 } from 'src/view/helpers/mandala/nx9/set-active-cell';
    import Nx9Layout from 'src/views/view-nx9/layout.svelte';
    import { assembleNx9Rows } from 'src/views/view-nx9/assemble-cell-view-model';

    const view = getView();
    const nx9RowsPerPage = Nx9RowsPerPageStore(view);
    const documentState = derived(view.documentStore, (state) => state);
    const mandalaUiState = derived(view.viewStore, (state) => state.ui.mandala);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
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

    $: nx9Context = resolveNx9Context({
        sectionIdMap: $documentState.sections.section_id,
        documentContent: $documentState.document.content,
        rowsPerPage: $nx9RowsPerPage,
        activeSection:
            $documentState.sections.id_section[$activeNodeId] ?? null,
        activeCell: $mandalaUiState.activeCellNx9,
    });

    $: activeCell = $mandalaUiState.activeCellNx9;
    $: rowCount = nx9Context.rowsPerPage;
    $: futureScale =
        rowCount <= 5 ? 1 : Math.max(0.58, Math.min(1, 5 / rowCount));
    $: nx9Rows = assembleNx9Rows({
        context: nx9Context,
        documentState: $documentState,
        activeNodeId: $activeNodeId,
        activeCell,
        editingState: $editingState,
        selectedNodes: $selectedNodes,
        pinnedSections: $pinnedSections,
        sectionColors: $sectionColors,
        sectionColorOpacity: $sectionColorOpacity,
        backgroundMode: $backgroundMode,
        showDetailSidebar: $showDetailSidebar,
        whiteThemeMode: $whiteThemeMode,
    });

    const selectGhostCreateCell = (row: number) => {
        setActiveCellNx9(view, {
            row,
            col: 0,
            page: nx9Context.currentPage,
        });
    };

    const selectRealCell = (
        row: number,
        col: number,
        nodeId: string | null,
    ) => {
        if (!nodeId) return;
        setActiveCellNx9(view, {
            row,
            col,
            page: nx9Context.currentPage,
        });
    };
</script>

<Nx9Layout
    rows={nx9Rows}
    currentPage={nx9Context.currentPage}
    {rowCount}
    {futureScale}
    {selectGhostCreateCell}
    {selectRealCell}
/>
