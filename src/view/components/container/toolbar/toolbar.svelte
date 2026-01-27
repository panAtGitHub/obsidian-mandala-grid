<script>
    import NavigationHistory from './components/navigation-buttons.svelte';
    import SearchToggle from './components/search-toggle.svelte';
    import { getView } from 'src/view/components/container/context';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import SearchInput from './components/search-input.svelte';
    import LeftSidebarToggle from './components/left-sidebar-toggle.svelte';
    import SearchNavigationButtons from './components/search/search-navigation-buttons.svelte';
    // import DocumentHistoryButtons from './components/document-history-buttons.svelte';
    import SearchActions from './components/search-actions.svelte';
    import { writable, derived } from 'svelte/store';
    import { Eye, Menu } from 'lucide-svelte';
    import { Platform } from 'obsidian';
    import { onMount } from 'svelte';
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

    import { 
        mobileInteractionMode, 
        toggleMobileInteractionMode 
    } from 'src/stores/view/mobile-interaction-store';
    import { Lock, Unlock, Grid3x3, Grid2x2, Type } from 'lucide-svelte';
    import {
        MandalaModeStore,
        Show9x9TitleOnlyStore,
        ShowHiddenCardInfoStore,
    } from 'src/stores/settings/derived/view-settings-store';

    const mode = MandalaModeStore(view);
    const show9x9TitleOnly = Show9x9TitleOnlyStore(view);
    const showHiddenCardInfo = ShowHiddenCardInfoStore(view);
    const toggleMandalaMode = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/toggle-mode',
        });
    };

    const toggleHiddenCardInfo = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-hidden-card-info',
        });
    };

    const toggle9x9TitleOnly = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-9x9-title-only',
        });
    };
    
    // 检测是否是 Mandala 模式
    const isMandalaMode = derived(
        view.viewStore,
        (state) => view.mandalaMode !== null
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

    const closeSearch = () => {
        view.viewStore.dispatch({ type: 'view/search/toggle-input' });
    };

    let visualViewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
    let visualViewportOffsetTop = window.visualViewport?.offsetTop ?? 0;
    let keyboardInsetBottom = 0;

    const updateVisualViewportVars = () => {
        const vv = window.visualViewport;
        if (!vv) {
            visualViewportHeight = window.innerHeight;
            visualViewportOffsetTop = 0;
            keyboardInsetBottom = 0;
            return;
        }
        visualViewportHeight = vv.height;
        visualViewportOffsetTop = vv.offsetTop;
        // iOS: when the keyboard appears, visualViewport shrinks.
        // Keep the modal within the remaining visible space.
        keyboardInsetBottom = Math.max(
            0,
            window.innerHeight - vv.height - vv.offsetTop,
        );
    };

    onMount(() => {
        if (!isMobile) return;
        // Keep the search modal pinned to the *visible* viewport when the iOS
        // keyboard appears (visualViewport shrinks/offsets).
        updateVisualViewportVars();

        const vv = window.visualViewport;
        vv?.addEventListener('resize', updateVisualViewportVars);
        vv?.addEventListener('scroll', updateVisualViewportVars);
        window.addEventListener('orientationchange', updateVisualViewportVars);

        return () => {
            vv?.removeEventListener('resize', updateVisualViewportVars);
            vv?.removeEventListener('scroll', updateVisualViewportVars);
            window.removeEventListener(
                'orientationchange',
                updateVisualViewportVars,
            );
        };
    });
</script>

<div class="navigation-history-container" data-search-open={$search.showInput}>
    <div class="toolbar-group toolbar-group--left">
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
            <Button
                active={$showHiddenCardInfo}
                label={lang.controls_toggle_hidden_card_info}
                on:click={toggleHiddenCardInfo}
                tooltipPosition="bottom"
            >
                <Eye class="svg-icon" />
            </Button>
            <NavigationHistory />
            <!-- <DocumentHistoryButtons /> -->
            <SearchToggle />
        </div>

        {#if $search.showInput && !isMobile}
            <div class="search-input-wrapper" style="position: relative;">
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
    </div>

    <div class="toolbar-spacer" />

    <div class="toolbar-group toolbar-group--center">
        <div class="lock-toggle-container">
            {#if $mode === '9x9'}
                <Button
                    active={$show9x9TitleOnly}
                    label="仅显示标题"
                    on:click={toggle9x9TitleOnly}
                    tooltipPosition="bottom"
                >
                    <Type class="svg-icon" size="18" />
                </Button>
            {/if}
            <Button
                active={$mode === '9x9'}
                label={$mode === '3x3' ? '切换到 9x9' : '切换到 3x3'}
                on:click={toggleMandalaMode}
                tooltipPosition="bottom"
            >
                {#if $mode === '3x3'}
                    <Grid3x3 class="svg-icon" size="18" />
                {:else}
                    <Grid2x2 class="svg-icon" size="18" />
                {/if}
            </Button>
            <div class="divider"></div>
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
    </div>

    <div class="toolbar-spacer" />
</div>

{#if isMobile && $search.showInput}
    <div
        class="search-modal-backdrop"
        style={`--vvh: ${visualViewportHeight}px; --vvo: ${visualViewportOffsetTop}px; --kbd: ${keyboardInsetBottom}px;`}
        on:click={closeSearch}
    >
        <div class="search-modal" on:click|stopPropagation>
            <div class="search-modal-header">
                <div class="search-modal-title">搜索</div>
                <button class="search-modal-close" on:click={closeSearch}>
                    关闭
                </button>
            </div>
            <div class="search-modal-body">
                <SearchInput />
                {#if $search.query.length > 0}
                    {#if $isMandalaMode}
                        {#if $mandalaSearchResults.length > 0}
                            <MandalaSearchResults results={$mandalaSearchResults} />
                        {/if}
                    {:else}
                        <SearchNavigationButtons
                            results={Array.from($search.results.keys())}
                        />
                        {#if $search.results.size > 0}
                            <SearchActions />
                        {/if}
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .navigation-history-container {
        z-index: var(--z-index-breadcrumbs);
        display: flex;
        gap: var(--size-4-2);
        flex-wrap: wrap;
        width: 100%;
        pointer-events: none;
        align-items: center;
        justify-content: space-between;
    }
    .navigation-history-container :global(> *) {
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

    .toolbar-group--left {
        flex: 0 1 auto;
    }

    .toolbar-group--center {
        flex: 0 0 auto;
    }

    .toolbar-spacer {
        flex: 1 1 auto;
    }

    .mobile-toggle {
        display: none;
    }

    .lock-toggle-container {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .divider {
        width: 1px;
        height: 16px;
        background-color: var(--background-modifier-border);
        margin: 0 4px;
    }

    :global(.is-mobile) {
        & .navigation-history-container {
            width: 100%;
            position: static;
        }
        & .toolbar-group--left {
            flex-wrap: wrap;
            width: 100%;
        }
        & .toolbar-spacer {
            flex: 1 1 auto;
        }
        & .mobile-toggle {
            display: block;
        }
        & .lock-toggle-container {
            transform: none;
            z-index: 1002;
            background: var(--background-primary);
            padding: 2px 6px;
            border-radius: 16px;
            border: 1px solid var(--background-modifier-border);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

    .search-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 1200;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 16px;
        padding-top: calc(env(safe-area-inset-top, 0px) + 16px);
        padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px + var(--kbd, 0px));
    }

    .search-modal {
        width: min(92vw, 420px);
        max-height: calc(100vh - 32px - var(--kbd, 0px));
        background: var(--background-primary);
        border-radius: 20px;
        border: 1px solid var(--background-modifier-border);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .search-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
    }

    .search-modal-title {
        font-weight: 600;
        font-size: 16px;
        color: var(--text-normal);
    }

    .search-modal-close {
        background: transparent;
        border: none;
        color: var(--interactive-accent);
        font-weight: 600;
        padding: 6px 10px;
        border-radius: 999px;
        cursor: pointer;
    }

    .search-modal-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px 16px 16px;
        overflow: auto;
        flex: 1 1 auto;
    }

    :global(.is-mobile) .search-modal-body .search-input-wrapper {
        width: 100%;
    }

    :global(.is-mobile) .search-modal-body .mandala-search-results {
        position: static;
        margin-top: 0;
        max-height: none;
    }
</style>
