<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import { Nx9RowsPerPageStore } from 'src/stores/settings/derived/view-settings-store';
    import { getView } from 'src/view/components/container/context';
    import { resolveNx9Context } from 'src/view/helpers/mandala/nx9/context';
    import Nx9GridDesktop from 'src/view/components/mandala/nx9/nx9-grid-desktop.svelte';

    const view = getView();
    const nx9RowsPerPage = Nx9RowsPerPageStore(view);
    const documentState = derived(view.documentStore, (state) => state);
    const mandalaUiState = derived(view.viewStore, (state) => state.ui.mandala);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );

    $: nx9Context = resolveNx9Context({
        sectionIdMap: $documentState.sections.section_id,
        documentContent: $documentState.document.content,
        rowsPerPage: $nx9RowsPerPage,
        activeSection:
            $documentState.sections.id_section[$activeNodeId] ?? null,
        activeCell: $mandalaUiState.activeCellNx9,
    });
</script>

<Nx9GridDesktop context={nx9Context} />
