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
</script>

<div class="navigation-history-container">
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

        {#if $search.showInput}
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
</style>
