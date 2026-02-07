<script lang="ts">
    import { onDestroy } from 'svelte';
    import { derived as svelteDerived } from 'svelte/store';

    import { getView } from 'src/view/components/container/context';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import SearchInput from 'src/view/components/container/toolbar/components/search-input.svelte';
    import SearchNavigationButtons from 'src/view/components/container/toolbar/components/search/search-navigation-buttons.svelte';
    import SearchActions from 'src/view/components/container/toolbar/components/search-actions.svelte';

    import type { MandalaSearchResult } from 'src/view/helpers/mandala/search-utils';
    import {
        convertToMandalaResults,
        navigateToSearchResult,
        previewSearchResult,
    } from 'src/view/helpers/mandala/search-utils';

    const view = getView();
    const search = searchStore(view);

    const isMandalaMode = svelteDerived(view.viewStore, () => view.mandalaMode !== null);
    const mandalaSearchResults = svelteDerived(
        [search, view.documentStore],
        ([$search, $doc]) => {
            if (!$search.results || $search.results.size === 0) return [];
            return convertToMandalaResults($search.results, $doc.sections.id_section);
        },
    );

    let selectedIndex = -1;
    let pendingResult: MandalaSearchResult | null = null;

    const close = () => {
        view.viewStore.dispatch({ type: 'view/search/toggle-input' });
    };

    const onDone = () => {
        if (pendingResult) {
            navigateToSearchResult(pendingResult.section, view);
        }
        close();
    };

    const selectResult = (result: MandalaSearchResult, index: number) => {
        selectedIndex = index;
        pendingResult = result;
        previewSearchResult(result.section, view);
    };

    // Keep the full-screen search pinned to the visible viewport on iOS
    // when the keyboard changes visualViewport height/offset.
    let visualViewportHeight = window.innerHeight;
    let visualViewportOffsetTop = 0;

    const updateVisualViewport = () => {
        const vv = window.visualViewport;
        if (!vv) {
            visualViewportHeight = window.innerHeight;
            visualViewportOffsetTop = 0;
            return;
        }
        visualViewportHeight = vv.height;
        visualViewportOffsetTop = vv.offsetTop;
    };

    updateVisualViewport();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', updateVisualViewport);
    vv?.addEventListener('scroll', updateVisualViewport);
    window.addEventListener('orientationchange', updateVisualViewport);

    onDestroy(() => {
        vv?.removeEventListener('resize', updateVisualViewport);
        vv?.removeEventListener('scroll', updateVisualViewport);
        window.removeEventListener('orientationchange', updateVisualViewport);
    });

    // Reset selection when query changes.
    $: if ($search.query) {
        $search.query;
        selectedIndex = -1;
        pendingResult = null;
    }

</script>

<div
    class="mobile-search-root"
    style={`--vvh: ${visualViewportHeight}px; --vvo: ${visualViewportOffsetTop}px;`}
    on:click|stopPropagation
>
    <div class="mobile-search-header">
        <div class="mobile-search-header-row">
            <div class="mobile-search-header-spacer" aria-hidden="true"></div>
            <div class="mobile-search-title">搜索</div>
            <button class="mobile-search-done" on:click|stopPropagation={onDone}>
                完成
            </button>
        </div>
        <div class="mobile-search-input-row">
            <SearchInput />
        </div>
    </div>

    <div class="mobile-search-body">
        {#if $search.query.length === 0}
            <div class="mobile-search-hint">输入关键词开始搜索</div>
        {:else if $search.searching}
            <div class="mobile-search-hint">搜索中...</div>
        {:else if $isMandalaMode}
            <div class="results-count">{($mandalaSearchResults ?? []).length} 个结果</div>
            {#if ($mandalaSearchResults ?? []).length === 0}
                <div class="no-results">无匹配结果</div>
            {:else}
                <div class="results-list" role="listbox">
                    {#each $mandalaSearchResults as result, index (result.nodeId)}
                        <button
                            class="result-item"
                            class:is-selected={selectedIndex === index}
                            type="button"
                            on:click|stopPropagation={() => selectResult(result, index)}
                        >
                            <div class="section-path">{result.section}</div>
                            <div class="content-preview">{result.contentPreview}</div>
                        </button>
                    {/each}
                </div>
            {/if}
        {:else}
            <SearchNavigationButtons results={Array.from($search.results.keys())} />
            {#if $search.results.size > 0}
                <SearchActions />
            {/if}
        {/if}
    </div>
</div>

<style>
    .mobile-search-root {
        position: fixed;
        top: var(--vvo, 0px);
        left: 0;
        right: 0;
        height: var(--vvh, 100vh);
        background: var(--background-primary);
        display: flex;
        flex-direction: column;
        z-index: 1200;
    }

    .mobile-search-header {
        flex: 0 0 auto;
        padding: calc(env(safe-area-inset-top, 0px) + 10px) 12px 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
    }

    .mobile-search-header-row {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
    }

    .mobile-search-header-spacer {
        width: 1px;
        height: 1px;
    }

    .mobile-search-title {
        justify-self: center;
        font-weight: 700;
        font-size: 16px;
        color: var(--text-normal);
    }

    .mobile-search-done {
        justify-self: end;
        background: transparent;
        border: none;
        color: var(--interactive-accent);
        font-weight: 700;
        padding: 6px 10px;
        border-radius: 999px;
        cursor: pointer;
    }

    .mobile-search-input-row {
        width: 100%;
    }

    /* SearchInput is a separate component; use global selectors for its internal classnames. */
    :global(.is-mobile .mobile-search-input-row .search-input-wrapper) {
        width: 100%;
        max-width: 100%;
    }
    :global(.is-mobile .mobile-search-input-row .search-input-element) {
        width: 100%;
        min-width: 0;
    }

    .mobile-search-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 12px;
        padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
    }

    .mobile-search-hint {
        color: var(--text-muted);
        font-size: 13px;
        padding: 8px 2px;
    }

    .results-count {
        padding: 8px 12px;
        font-size: 11px;
        color: var(--text-muted);
        border: 1px solid var(--background-modifier-border);
        border-bottom: none;
        border-radius: var(--radius-m) var(--radius-m) 0 0;
        background: var(--background-secondary);
    }

    .results-list {
        border: 1px solid var(--background-modifier-border);
        border-radius: 0 0 var(--radius-m) var(--radius-m);
        overflow: hidden;
        background: var(--background-primary);
        box-shadow: var(--shadow-l);
    }

    .no-results {
        padding: 16px 12px;
        text-align: center;
        font-size: 13px;
        color: var(--text-muted);
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-m);
        background: var(--background-primary);
    }

    .result-item {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 6px;
        width: 100%;
        text-align: left;
        padding: 12px;
        margin: 0;
        border: none;
        background: transparent;
        border-bottom: 1px solid var(--background-modifier-border);
        cursor: pointer;
        height: auto !important;
        min-height: unset !important;
        line-height: normal;
        appearance: none;
        -webkit-appearance: none;
    }
    .result-item:last-child {
        border-bottom: none;
    }
    .result-item:active {
        background: var(--background-modifier-active-hover);
    }
    .result-item.is-selected {
        background: var(--background-modifier-hover);
        outline: 2px solid var(--interactive-accent);
        outline-offset: -2px;
    }

    .section-path {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-accent);
        margin-bottom: 4px;
        font-family: var(--font-monospace);
    }

    .content-preview {
        font-size: 12px;
        color: var(--text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.4;
    }
</style>
