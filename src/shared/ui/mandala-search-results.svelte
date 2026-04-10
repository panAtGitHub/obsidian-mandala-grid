<script lang="ts">
    import { onDestroy } from 'svelte';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import type { MandalaSearchResult } from 'src/mandala-interaction/helpers/search-utils';
    import { navigateToSearchResult, previewSearchResult } from 'src/mandala-interaction/helpers/search-utils';
    
    export let results: MandalaSearchResult[];
    export let deferNavigation = false;
    export let onSelect: ((_result: MandalaSearchResult) => void) | undefined =
        undefined;
    export let layout: 'dropdown' | 'list' = 'dropdown';
    
    const view = getView();
    const SEARCH_INPUT_SELECTOR = '.search-input-wrapper';
    
    // 当前选中的索引（-1 表示无选中）
    let selectedIndex = -1;
    let keyboardNavigationActive = false;
    
    // Hover 预览的延迟定时器
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;

    $: if (results.length === 0) {
        selectedIndex = -1;
    } else if (selectedIndex >= results.length) {
        selectedIndex = results.length - 1;
    }
    
    // 处理鼠标悬停（延迟 200ms）
    function handleHover(index: number) {
        if (hoverTimer) clearTimeout(hoverTimer);
        
        hoverTimer = setTimeout(() => {
            selectedIndex = index;
            previewSearchResult(results[index].section, view);
            // Hover 时不需要保持焦点，因为焦点可能在其他地方
        }, 200);
    }
    
    // 处理鼠标离开（清除延迟）
    function handleMouseLeave() {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
    }
    
    // 处理点击（确认选择）
    function handleClick(result: MandalaSearchResult, index: number) {
        selectedIndex = index;
        previewSearchResult(result.section, view);

        if (deferNavigation) {
            onSelect?.(result);
            return;
        }

        navigateToSearchResult(result.section, view);
        // 确认后关闭搜索框，焦点自然转到格子
        view.viewStore.dispatch({ type: 'view/search/toggle-input' });
    }
    
    // 列表元素引用
    let listElement: HTMLElement;
    
    // 预览并保持焦点在列表
    function previewAndKeepFocus(section: string) {
        previewSearchResult(section, view);
        // 预览后立即将焦点重新设置回列表
        requestAnimationFrame(() => {
            if (listElement) listElement.focus();
        });
    }

    function activateKeyboardNavigation() {
        keyboardNavigationActive = true;
    }

    function deactivateKeyboardNavigation() {
        keyboardNavigationActive = false;
    }

    function handleFocus() {
        if (results.length === 0) return;
        activateKeyboardNavigation();
        if (selectedIndex >= 0) return;

        selectedIndex = 0;
        previewSearchResult(results[0].section, view);
    }
    
    function handleNavigationKey(e: KeyboardEvent) {
        if (!keyboardNavigationActive || results.length === 0) return;

        if (
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight' ||
            e.key === 'ArrowDown' ||
            e.key === 'ArrowUp' ||
            e.key === 'Enter' ||
            e.key === 'Escape' ||
            e.key === ' '
        ) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (e.key === 'ArrowDown') {
            selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
            if (selectedIndex >= 0) {
                previewAndKeepFocus(results[selectedIndex].section);
            }
        } else if (e.key === 'ArrowUp') {
            selectedIndex = Math.max(selectedIndex - 1, 0);
            if (selectedIndex >= 0) {
                previewAndKeepFocus(results[selectedIndex].section);
            }
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            deactivateKeyboardNavigation();
            handleClick(results[selectedIndex], selectedIndex);
        } else if (e.key === 'Escape') {
            // Esc 退出搜索
            deactivateKeyboardNavigation();
            view.viewStore.dispatch({ type: 'view/search/toggle-input' });
        }
    }

    function handleWindowKeyDown(e: KeyboardEvent) {
        handleNavigationKey(e);
    }

    function handleWindowPointerDown(e: PointerEvent) {
        if (!keyboardNavigationActive) return;
        const target = e.target;
        if (!(target instanceof HTMLElement)) {
            deactivateKeyboardNavigation();
            return;
        }
        if (target.closest('.mandala-search-results')) return;
        if (target.closest(SEARCH_INPUT_SELECTOR)) {
            deactivateKeyboardNavigation();
            return;
        }
        deactivateKeyboardNavigation();
    }
    
    // 清理定时器
    window.addEventListener('keydown', handleWindowKeyDown, true);
    window.addEventListener('pointerdown', handleWindowPointerDown, true);

    onDestroy(() => {
        if (hoverTimer) clearTimeout(hoverTimer);
        window.removeEventListener('keydown', handleWindowKeyDown, true);
        window.removeEventListener('pointerdown', handleWindowPointerDown, true);
    });
</script>

<div
    class="mandala-search-results"
    class:inFlow={layout === 'list'}
    bind:this={listElement}
    data-keyboard-navigation-active={keyboardNavigationActive ? 'true' : 'false'}
    on:focus={handleFocus}
    role="listbox"
    tabindex="-1"
>
    {#if results.length === 0}
        <div class="no-results">无匹配结果</div>
    {:else}
        <div class="results-count">{results.length} 个结果</div>
        {#each results as result, index (result.nodeId)}
            <div 
                class="search-result-item"
                class:selected={selectedIndex === index}
                on:mouseenter={() => handleHover(index)}
                on:mouseleave={handleMouseLeave}
                on:click={() => handleClick(result, index)}
                role="option"
                aria-selected={selectedIndex === index}
                tabindex="-1"
            >
                <div class="section-path">{result.section}</div>
                <div class="content-preview">{result.contentPreview}</div>
            </div>
        {/each}
    {/if}
</div>

<style>
    .mandala-search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: var(--radius-m);
        box-shadow: var(--shadow-l);
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
    }

    .mandala-search-results.inFlow {
        position: static;
        inset: auto;
        margin-top: 8px;
        max-height: none;
        z-index: auto;
    }
    
    .results-count {
        padding: 8px 12px;
        font-size: 11px;
        color: var(--text-muted);
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
    }
    
    .no-results {
        padding: 16px 12px;
        text-align: center;
        font-size: 13px;
        color: var(--text-muted);
    }
    
    .search-result-item {
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid var(--background-modifier-border);
        transition: background-color 0.1s ease;
    }
    
    .search-result-item:last-child {
        border-bottom: none;
    }
    
    .search-result-item:hover {
        background: var(--background-modifier-hover);
    }
    
    .search-result-item:active {
        background: var(--background-modifier-active-hover);
    }
    
    .section-path {
        font-size: 13px;
        font-weight: 600;
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
    
    /* 选中状态样式 */
    .search-result-item.selected {
        background: var(--background-modifier-hover);
        outline: 2px solid var(--interactive-accent);
        outline-offset: -2px;
    }

    /* 移动端优化 */
    @media (max-width: 568px) {
        .mandala-search-results {
            position: static;
            margin-top: 8px;
            max-height: 60vh;
        }
        
        .search-result-item {
            padding: 12px;
        }
        
        .section-path {
            font-size: 14px;
        }
        
        .content-preview {
            font-size: 13px;
        }
    }
</style>
