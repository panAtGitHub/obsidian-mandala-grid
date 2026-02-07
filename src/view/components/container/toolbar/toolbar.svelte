<script>
    import SearchToggle from './components/search-toggle.svelte';
    import { getView } from 'src/view/components/container/context';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import SearchInput from './components/search-input.svelte';
    import LeftSidebarToggle from './components/left-sidebar-toggle.svelte';
    import SearchNavigationButtons from './components/search/search-navigation-buttons.svelte';
    import SearchActions from './components/search-actions.svelte';
    import { writable, derived } from 'svelte/store';
    import { Menu } from 'lucide-svelte';
    import { Platform } from 'obsidian';
    import Button from '../shared/button.svelte';
    import { lang } from 'src/lang/lang';
    
    // Mandala 搜索相关导入
    import MandalaSearchResults from 'src/view/components/mandala/mandala-search-results.svelte';
    import { convertToMandalaResults } from 'src/view/helpers/mandala/search-utils';

    const view = getView();
    const search = searchStore(view);

    const showControls = writable(false);
    const toggleShowControls = () => {
        showControls.update((v) => !v);
    };

    // The center controls (9x9/3x3) live in toolbar-center.svelte.
    
    // 检测是否是 Mandala 模式
    const isMandalaMode = derived(
        view.viewStore,
        () => view.mandalaMode !== null
    );
    
    // Mandala 搜索结果
    const mandalaSearchResults = derived(
        [search, view.documentStore],
        ([$search, $doc]) => {
            if (!$search.results || $search.results.size === 0) {
                return [];
            }
            return convertToMandalaResults($search.results, $doc.sections.id_section);
        }
    );

    const isMobile = Platform.isMobile;
</script>

<div class="toolbar-left" data-search-open={$search.showInput}>
    <div class="toolbar-group">
        <div class="mobile-toggle">
            <Button
                active={$showControls}
                classes="topbar-button"
                label={lang.controls_toggle_bar}
                on:click={toggleShowControls}
                tooltipPosition="bottom"
            >
                <Menu class="svg-icon" />
            </Button>
        </div>

        <div
            class="buttons-group-wrapper"
            class:topbar-mobile-popover={isMobile}
            data-visible={$showControls}
        >
            <LeftSidebarToggle />
            <SearchToggle />
        </div>
    </div>
</div>

{#if $search.showInput && !isMobile}
    <div class="toolbar-search-input-wrapper">
        <SearchInput />
        
        {#if $search.query.length > 0}
            {#if $isMandalaMode}
                <!-- Mandala 模式：显示搜索结果下拉列表 -->
                {#if $mandalaSearchResults.length > 0}
                    <MandalaSearchResults results={$mandalaSearchResults} />
                {/if}
            {:else}
                <!-- Lineage 模式：显示导航按钮 -->
                <SearchNavigationButtons
                    results={Array.from($search.results.keys())}
                />
                {#if $search.results.size > 0}
                    <SearchActions />
                {/if}
            {/if}
        {/if}
    </div>
{/if}

<style>
    .toolbar-left {
        z-index: var(--z-index-breadcrumbs);
        display: flex;
        gap: var(--size-4-2);
        flex-wrap: nowrap;
        width: auto;
        pointer-events: none;
        align-items: center;
        position: relative;
    }
    .toolbar-left :global(> *) {
        pointer-events: auto;
    }

    .buttons-group-wrapper {
        display: flex;
        gap: var(--size-4-2);
    }

    .toolbar-group {
        display: flex;
        align-items: center;
        gap: var(--size-4-2);
    }

    .toolbar-search-input-wrapper {
        position: relative;
        margin-left: 6px;
    }

    .mobile-toggle {
        display: none;
    }

    :global(.is-mobile) {
        & .mobile-toggle {
            display: block;
        }
        & .buttons-group-wrapper[data-visible='true'] {
            top: 45px;
            left: var(--size-4-2);
        }
        & .buttons-group-wrapper[data-visible='false'] {
            display: none;
        }
    }

</style>
