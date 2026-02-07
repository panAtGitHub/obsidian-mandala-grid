<script lang="ts">
    import { lang } from '../../../../../lang/lang';
    import { getView } from '../../context';

    let searchTerm = '';
    const view = getView();

    $: {
        view.viewStore.dispatch({
            type: 'view/hotkeys/set-search-term',
            payload: {
                searchTerm,
            },
        });
    }
</script>
<div class="front">
    <div class="search-input-container">
        <input
            bind:value={searchTerm}
            class="search-input"
            enterkeyhint="search"
            placeholder={lang.modals_hk_input_placeholder}
            spellcheck="false"
            type="search"
        />
        <div
            aria-label={lang.tlb_search_clear}
            class="search-input-clear-button"
            on:click={() => {
                    searchTerm = '';
                }}
            style={'right: 8px; top: -1px;' + (searchTerm ? '' : ' display: none;')}
        ></div>
    </div>
</div>
<style>
    .front {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }

    .search-input-container {
        width: 100%;
    }
</style>
