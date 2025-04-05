<script lang="ts">
    import { ChevronDown, ChevronUp } from 'lucide-svelte';
    import Button from '../../../shared/button.svelte';
    import { getView } from 'src/view/components/container/context';
    import { sortNodeIdsBySectionNumber } from 'src/lib/tree-utils/sort/sort-node-ids-by-section-number';
    import { activeNodeStore } from 'src/stores/view/derived/active-node-store';
    import { lang } from 'src/lang/lang';

    const view = getView();
    export let results: string[]


    const activeNode = activeNodeStore(view);

    let sortedResults: string[]
    $:{
        sortedResults = sortNodeIdsBySectionNumber(
            view.documentStore.getValue().sections,
            results,
        );
    }





    const selectNextResult = () => {
        if (sortedResults.length === 0) return;
        const currentIndex = sortedResults.indexOf($activeNode);
        const nextId = sortedResults[(currentIndex + 1) % sortedResults.length];
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse',
            payload: { id: nextId },
        });
    };

    const selectPreviousResult = () => {
        if (sortedResults.length === 0) return;
        const currentIndex = sortedResults.indexOf($activeNode) === -1 ? sortedResults.length : sortedResults.indexOf($activeNode);
        const prevId = sortedResults[(currentIndex - 1 + sortedResults.length) % sortedResults.length];
        view.viewStore.dispatch({
            type: 'view/set-active-node/mouse',
            payload: { id: prevId },
        });
    };
</script>

<div class="search-container buttons-group">
    <Button
        disabled={sortedResults.length===0 }
        label={lang.tlb_search_previous_result}
        on:click={selectPreviousResult}
        tooltipPosition="bottom"
    >
        <ChevronUp class="svg-icon" size="12" />
    </Button>


    <Button
        disabled={sortedResults.length===0 }
        label={lang.tlb_search_next_result}
        on:click={selectNextResult}
        tooltipPosition="bottom"
    >
        <ChevronDown class="svg-icon" size="12" />
    </Button>
    <div class="search-stats">
        {`${sortedResults.indexOf($activeNode) + 1} / ${sortedResults.length}`}
    </div>
</div>

<style>
    .search-container {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .search-stats {
        color: var(--text-muted);
        font-size: var(--status-bar-font-size);
        font-variant-numeric: tabular-nums;
        padding: 5px 10px;
        border-left: 1px solid var(--text-faint);
    }
</style>
