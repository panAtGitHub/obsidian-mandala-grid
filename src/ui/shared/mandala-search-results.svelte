<script lang="ts">
    import { onDestroy } from 'svelte';
    import { getView } from 'src/view/components/container/context';
    import type { MandalaSearchResult } from 'src/view/helpers/mandala/search-utils';
    import { navigateToSearchResult, previewSearchResult } from 'src/view/helpers/mandala/search-utils';
    
    export let results: MandalaSearchResult[];
    export let deferNavigation = false;
    export let onSelect: ((_result: MandalaSearchResult) => void) | undefined =
        undefined;
    export let layout: 'dropdown' | 'list' = 'dropdown';
    
    const view = getView();
    
    // 当前选中的索引（-1 表示无选中）
    let selectedIndex = -1;
    
    // Hover 预览的延迟定时器
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    
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
    
    // 键盘导航
    function handleKeyDown(e: KeyboardEvent) {
        if (results.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
            if (selectedIndex >= 0) {
                previewAndKeepFocus(results[selectedIndex].section);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            if (selectedIndex >= 0) {
                previewAndKeepFocus(results[selectedIndex].section);
            }
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            e.stopPropagation();
            handleClick(results[selectedIndex], selectedIndex);
        } else if (e.key === 'Escape') {
            // Esc 退出搜索
            e.preventDefault();
            e.stopPropagation();
            view.viewStore.dispatch({ type: 'view/search/toggle-input' });
        }
    }
    
    // 清理定时器
    onDestroy(() => {
        if (hoverTimer) clearTimeout(hoverTimer);
    });
</script>

<div
    class="mandala-search-results"
    class:inFlow={layout === 'list'}
    bind:this={listElement}
    on:keydown={handleKeyDown}
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
                tabindex="0"
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
