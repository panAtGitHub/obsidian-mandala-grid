<script lang="ts">
    import { Search } from 'lucide-svelte';
    import { getView } from '../../context';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import Button from '../../shared/button.svelte';
    import { lang } from 'src/lang/lang';

    const view = getView();
    const viewStore = view.viewStore;
    const search = searchStore(view);
</script>

<div class="search-container topbar-buttons-group">
    <Button
        active={$search.showInput}
        classes="topbar-button"
        label={lang.tlb_search_toggle}
        on:click={() => {
            viewStore.dispatch({ type: 'view/search/toggle-input' });
        }}
        tooltipPosition="bottom"
    >
        <Search class="svg-icon" size="12" />
    </Button>

</div>

<style>
    .search-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--size-4-2);
    }
</style>
