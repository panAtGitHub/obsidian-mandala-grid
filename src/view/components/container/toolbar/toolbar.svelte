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

    import { 
        mobileInteractionMode, 
        toggleMobileInteractionMode 
    } from 'src/stores/view/mobile-interaction-store';
    import { Lock, Unlock } from 'lucide-svelte';
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

    <div class="lock-toggle-container">
        <Button
            active={$mobileInteractionMode === 'unlocked'}
            label={$mobileInteractionMode === 'locked' ? '锁定模式 (导航优先)' : '解锁模式 (编辑优先)'}
            on:click={toggleMobileInteractionMode}
            tooltipPosition="bottom"
        >
            {#if $mobileInteractionMode === 'locked'}
                <Lock class="svg-icon" size="18" />
            {:else}
                <Unlock class="svg-icon" size="18" />
            {/if}
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
        display: flex;
        gap: var(--size-4-2);
        flex-wrap: wrap;
        max-width: fit-content;
        pointer-events: none;
    }
    .navigation-history-container :global(> *) {
        pointer-events: auto;
    }

    .buttons-group-wrapper {
        display: flex;
        gap: var(--size-4-2);
    }

    .lock-toggle-container {
        display: none;
    }

    :global(.is-mobile) {
        & .navigation-history-container {
            width: auto;
            position: static;
        }
        & .mobile-toggle {
            display: block;
        }
        & .lock-toggle-container {
            display: block;
            position: absolute;
            left: 50%;
            top: 4px;
            transform: translateX(-50%);
            z-index: 1002;
        }
        & .buttons-group-wrapper[data-visible='true'] {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 45px;
            left: var(--size-4-2);
            background: var(--background-primary);
            padding: var(--size-4-2);
            border-radius: var(--radius-m);
            box-shadow: var(--shadow-l);
            border: 1px solid var(--background-modifier-border);
            z-index: 1001;
            gap: 8px;
        }
        & .buttons-group-wrapper[data-visible='false'] {
            display: none;
        }
    }
</style>
