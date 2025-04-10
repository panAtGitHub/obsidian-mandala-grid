<script lang="ts">
    import { getView } from '../../context';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import { Eye, Text } from 'lucide-svelte';
    import { lang } from 'src/lang/lang';

    const view = getView();
    const viewStore = view.viewStore;
    const search = searchStore(view);

    const onInput = (
        // eslint-disable-next-line no-undef
        e: Event & { currentTarget: EventTarget & HTMLInputElement },
    ) => {
        viewStore.dispatch({
            type: 'view/search/set-query',
            payload: {
                query: e.currentTarget.value,
            },
        });
    };
</script>

<div class="search-input-wrapper search-input-container">
    <input
        autofocus={true}
        class={"search-input search-input-element"+($search.query && $search.results.size===0 && !$search.searching?' no-results':'')}
        enterkeyhint="search"
        on:input={onInput}
        placeholder={'search'}
        spellcheck="false"
        type="search"
        value={$search.query}
    />
    <div
        aria-label={lang.tlb_search_clear}
        class="search-input-clear-button"
        on:click={() => {
            viewStore.dispatch({
                type: 'view/search/set-query',
                payload: {
                    query: '',
                },
            });
        }}
        style={'right: 49px; top: -1px;'+($search.query ? '' : ' display: none;')}
    ></div>

    {#if $search.query.length > 0}
        <div
            aria-label={lang.tlb_search_show_all_nodes}
            class={'input-right-decorator clickable-icon' +
                ($search.showAllNodes ? ' is-active' : '')}
            on:click={() => {
                viewStore.dispatch({
                    type: 'search/view/toggle-show-all-nodes',
                });
            }}
            style="right: 28px"
        >
            <Eye class="svg-icon" />
        </div>
    {/if}
    <div
        aria-label={lang.tlb_search_fuzzy_search}
        class={'input-right-decorator clickable-icon' +
            ($search.fuzzySearch ? ' is-active' : '')}
        on:click={() => {
            viewStore.dispatch({
                type: 'view/search/toggle-fuzzy-mode',
            });
            viewStore.dispatch({
                type: 'view/search/set-query',
                payload: {
                    query: viewStore.getValue().search.query,
                },
            });
        }}
        style="right: 4px;"
    >
        <Text class="svg-icon" />
    </div>
</div>

<style>
    .search-input-element {
        height: 34px;
        padding-right: 74px !important;
        padding-left: 12px;
        min-width: 250px;
    }

    @media (max-width: 568px) {
        .search-input-element {
            width: 100%;
            min-width: 50px;
        }
        .search-input-wrapper {
            width: 100%;
        }
    }

    .search-input-wrapper {
        max-width: 100%;
    }

    .search-input-container::before {
        display: none;
    }
    .no-results{
        box-shadow: 0 0 0 2px var(--color-red) !important;
    }
</style>
