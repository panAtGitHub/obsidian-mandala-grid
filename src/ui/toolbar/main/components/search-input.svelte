<script lang="ts">
    import { getView } from '../../context';
    import { searchStore } from 'src/stores/view/derived/search-store';
    import { Text } from 'lucide-svelte';
    import { lang } from 'src/lang/lang';
    import { Platform } from 'obsidian';

    const view = getView();
    const viewStore = view.viewStore;
    const search = searchStore(view);
    
    // 中文输入法状态标记
    let isComposing = false;

    const onCompositionStart = () => {
        isComposing = true;
    };

    const onCompositionEnd = (e: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
        isComposing = false;
        // 中文输入完成后，立即触发搜索
        viewStore.dispatch({
            type: 'view/search/set-query',
            payload: {
                query: e.currentTarget.value,
            },
        });
    };

    const onCompositionUpdate = (
        e: Event & { currentTarget: EventTarget & HTMLInputElement },
    ) => {
        // 移动端希望“输入法拼音阶段”也能实时更新结果（虽然不一定精确，但更符合预期）。
        viewStore.dispatch({
            type: 'view/search/set-query',
            payload: {
                query: e.currentTarget.value,
            },
        });
    };

    const onInput = (
         
        e: Event & { currentTarget: EventTarget & HTMLInputElement },
    ) => {
        // 如果正在使用输入法（如拼音），不触发搜索
        if (isComposing) return;
        
        viewStore.dispatch({
            type: 'view/search/set-query',
            payload: {
                query: e.currentTarget.value,
            },
        });
    };
    
    // 阻止搜索框内的按键触发全局快捷键
    const onKeyDown = (e: KeyboardEvent) => {
        // 允许少数几个特殊键通过（用于退出搜索等）
        const allowedKeys = ['Escape', 'Tab'];
        
        if (allowedKeys.includes(e.key)) {
            return; // 允许这些键冒泡
        }
        
        // 移动端：不要因为 Enter/确定 而把焦点转到列表（否则键盘会收起）。
        if (Platform.isMobile && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // 桌面端：Enter 键将焦点转移到搜索结果列表，方便键盘导航
        if (!Platform.isMobile && e.key === 'Enter' && $search.results.size > 0) {
            e.preventDefault();
            e.stopPropagation();
            
            // 等待下一帧，确保 DOM 已更新
            setTimeout(() => {
                const resultsEl = document.querySelector('.mandala-search-results');
                if (resultsEl instanceof HTMLElement) {
                    resultsEl.focus();
                }
            }, 0);
            return;
        }
        
        // 阻止所有其他按键冒泡，包括：
        // - 字母键（j、k 等，可能触发导航快捷键）
        // - 方向键
        // - 数字键
        // - 特殊键（Backspace 等）
        e.stopPropagation();
    };
</script>

<div class="search-input-wrapper search-input-container">
    <input
        autofocus={true}
        class={"search-input search-input-element"+($search.query && $search.results.size===0 && !$search.searching?' no-results':'')}
        enterkeyhint="search"
        on:input={onInput}
        on:compositionstart={onCompositionStart}
        on:compositionupdate={onCompositionUpdate}
        on:compositionend={onCompositionEnd}
        on:keydown={onKeyDown}
        placeholder="search"
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
