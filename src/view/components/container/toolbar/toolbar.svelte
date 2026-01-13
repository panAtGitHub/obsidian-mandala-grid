<script>
    import NavigationHistory from './components/navigation-buttons.svelte';
    import SearchToggle from './components/search-toggle.svelte';
    import { getView } from 'src/view/components/container/context';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import SearchInput from './components/search-input.svelte';
    import LeftSidebarToggle from './components/left-sidebar-toggle.svelte';
    import SearchNavigationButtons from './components/search/search-navigation-buttons.svelte';
    import DocumentHistoryButtons from './components/document-history-buttons.svelte';
    import SearchActions from './components/search-actions.svelte';
    import { writable } from 'svelte/store';
    import { Menu } from 'lucide-svelte';
    import Button from '../shared/button.svelte';
    import { lang } from 'src/lang/lang';

    const view = getView();
    const search = searchStore(view);

    const showControls = writable(false);
    const toggleShowControls = () => {
        showControls.update((v) => !v);
    };
</script>

<div class="navigation-history-container">
    <div class="mobile-toggle">
        <Button
            active={$showControls}
            label={lang.controls_toggle_bar}
            on:click={toggleShowControls}
            tooltipPosition="bottom"
        >
            <Menu class="svg-icon" />
        </Button>
    </div>

    <div class="buttons-group-wrapper" data-visible={$showControls}>
        <LeftSidebarToggle />
        <NavigationHistory />
        <DocumentHistoryButtons />
        <SearchToggle />
    </div>

    {#if $search.showInput}
        <SearchInput />
        {#if $search.query.length > 0}
            <SearchNavigationButtons
                results={Array.from($search.results.keys())}
            />
            {#if $search.results.size > 0}
                <SearchActions />
            {/if}
        {/if}
    {/if}
</div>

<style>
    .navigation-history-container {
        z-index: var(--z-index-breadcrumbs);
        left: var(--size-4-2);
        top: var(--size-4-2);
        display: flex;
        position: absolute;
        gap: var(--size-4-2);
        flex-wrap: wrap;
        max-width: 90%;
    }

    .buttons-group-wrapper {
        display: flex;
        gap: var(--size-4-2);
    }

    .mobile-toggle {
        display: none;
    }

    :global(.is-mobile) {
        & .mobile-toggle {
            display: block;
        }
        & .buttons-group-wrapper[data-visible='false'] {
            display: none;
        }
    }
</style>
