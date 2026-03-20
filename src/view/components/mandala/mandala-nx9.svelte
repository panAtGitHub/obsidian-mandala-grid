<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import { Nx9RowsPerPageStore } from 'src/stores/settings/derived/view-settings-store';
    import { getView } from 'src/view/components/container/context';
    import {
        buildNx9BaseCells,
        resolveNx9Context,
    } from 'src/view/helpers/mandala/nx9-context';
    import RowMatrixGridDesktop from 'src/view/components/mandala/row-matrix-grid-desktop.svelte';

    const view = getView();
    const nx9RowsPerPage = Nx9RowsPerPageStore(view);
    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );

    let cells = [];

    $: nx9Context = resolveNx9Context({
        sectionIdMap: $documentState.sections.section_id,
        rowsPerPage: $nx9RowsPerPage,
        activeSection:
            $documentState.sections.id_section[$activeNodeId] ?? null,
    });

    $: cells = buildNx9BaseCells({
        pageRows: nx9Context.pageRows,
        sectionIdMap: $documentState.sections.section_id,
        documentContent: $documentState.document.content,
    });
</script>

<RowMatrixGridDesktop
    {cells}
    cellMode="nx9"
    fontVariable="--mandala-font-7x9"
/>
