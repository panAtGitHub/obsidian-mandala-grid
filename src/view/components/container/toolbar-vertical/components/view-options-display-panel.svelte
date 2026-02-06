<script lang="ts">
    import { Eye } from 'lucide-svelte';

    export let show = false;
    export let showHiddenCardInfo = false;
    export let show9x9ParallelNavButtons = true;

    export let toggle: () => void;
    export let toggleHiddenCardInfo: () => void;
    export let toggle9x9ParallelNavButtons: () => void;
</script>

<button class="view-options-menu__item" on:click={toggle}>
    <div class="view-options-menu__icon">
        <Eye class="view-options-menu__icon-svg" size={18} />
    </div>
    <div class="view-options-menu__content">
        <div class="view-options-menu__label">显示选项</div>
        <div class="view-options-menu__desc">辅助信息与按钮显示</div>
    </div>
</button>

{#if show}
    <div class="view-options-menu__submenu">
        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">显示 / 隐藏</div>

            <div class="view-options-menu__row">
                <span>Anki 卡片辅助信息</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={showHiddenCardInfo}
                            on:change={toggleHiddenCardInfo}
                        />
                        <span>{showHiddenCardInfo ? '显示中' : '已隐藏'}</span>
                    </label>
                </div>
            </div>

            <div class="view-options-menu__row">
                <span>9x9 平行九宫格切换按钮</span>
                <div class="view-options-menu__row-controls">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="checkbox"
                            checked={show9x9ParallelNavButtons}
                            on:change={toggle9x9ParallelNavButtons}
                        />
                        <span>{show9x9ParallelNavButtons ? '显示中' : '已隐藏'}</span>
                    </label>
                </div>
            </div>
        </div>
    </div>
{/if}
