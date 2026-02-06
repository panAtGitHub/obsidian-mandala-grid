<script lang="ts">
    import { RotateCcw, Type } from 'lucide-svelte';

    export let isMobile = false;
    export let show = false;

    export let fontSize3x3 = 16;
    export let fontSize9x9 = 11;
    export let fontSizeSidebar = 16;
    export let headingsFontSizeEm = 1.8;

    export let toggle: () => void;
    export let stepFontSize3x3: (current: number, delta: number) => void;
    export let updateFontSize3x3: (event: Event) => void;
    export let resetFontSize3x3: () => void;

    export let stepFontSize9x9: (current: number, delta: number) => void;
    export let updateFontSize9x9: (event: Event) => void;
    export let resetFontSize9x9: () => void;

    export let stepFontSizeSidebar: (current: number, delta: number) => void;
    export let updateFontSizeSidebar: (event: Event) => void;
    export let resetFontSizeSidebar: () => void;

    export let stepHeadingsFontSize: (current: number, delta: number) => void;
    export let updateHeadingsFontSize: (event: Event) => void;
    export let resetHeadingsFontSize: () => void;
</script>

<button class="view-options-menu__item" on:click={toggle}>
    <div class="view-options-menu__icon">
        <Type class="view-options-menu__icon-svg" size={18} />
    </div>
    <div class="view-options-menu__content">
        <div class="view-options-menu__label">
            字体设置（{isMobile ? '手机端' : 'PC端'}）
        </div>
        <div class="view-options-menu__desc">
            对 3x3 视图、9x9 视图、侧边栏字体进行调整
        </div>
    </div>
</button>

{#if show}
    <div class="view-options-menu__submenu">
        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">
                格子字体大小（{isMobile ? '手机端' : 'PC端'}）
            </div>

            <label class="view-options-menu__row">
                <span>3x3视图：</span>
                <div class="view-options-menu__range">
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepFontSize3x3(fontSize3x3, -1)}
                    >
                        -
                    </button>
                    <input
                        type="range"
                        min="6"
                        max="36"
                        step="1"
                        value={fontSize3x3}
                        on:input={updateFontSize3x3}
                    />
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepFontSize3x3(fontSize3x3, 1)}
                    >
                        +
                    </button>
                    <input
                        type="number"
                        min="6"
                        max="36"
                        step="1"
                        inputmode="numeric"
                        value={fontSize3x3}
                        on:change={updateFontSize3x3}
                    />
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetFontSize3x3}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </label>

            <label class="view-options-menu__row">
                <span>9x9视图：</span>
                <div class="view-options-menu__range">
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepFontSize9x9(fontSize9x9, -1)}
                    >
                        -
                    </button>
                    <input
                        type="range"
                        min="6"
                        max="36"
                        step="1"
                        value={fontSize9x9}
                        on:input={updateFontSize9x9}
                    />
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepFontSize9x9(fontSize9x9, 1)}
                    >
                        +
                    </button>
                    <input
                        type="number"
                        min="6"
                        max="36"
                        step="1"
                        inputmode="numeric"
                        value={fontSize9x9}
                        on:change={updateFontSize9x9}
                    />
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetFontSize9x9}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </label>

            <label class="view-options-menu__row">
                <span>侧边栏：</span>
                <div class="view-options-menu__range">
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepFontSizeSidebar(fontSizeSidebar, -1)}
                    >
                        -
                    </button>
                    <input
                        type="range"
                        min="6"
                        max="36"
                        step="1"
                        value={fontSizeSidebar}
                        on:input={updateFontSizeSidebar}
                    />
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepFontSizeSidebar(fontSizeSidebar, 1)}
                    >
                        +
                    </button>
                    <input
                        type="number"
                        min="6"
                        max="36"
                        step="1"
                        inputmode="numeric"
                        value={fontSizeSidebar}
                        on:change={updateFontSizeSidebar}
                    />
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetFontSizeSidebar}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </label>
        </div>

        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">
                标题字体大小（em）（可理解为正文字体的放大倍数）
            </div>
            <label class="view-options-menu__row">
                <span>H1</span>
                <div class="view-options-menu__range">
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepHeadingsFontSize(headingsFontSizeEm, -0.1)}
                    >
                        -
                    </button>
                    <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.1"
                        value={headingsFontSizeEm}
                        on:input={updateHeadingsFontSize}
                    />
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepHeadingsFontSize(headingsFontSizeEm, 0.1)}
                    >
                        +
                    </button>
                    <input
                        type="number"
                        min="1"
                        max="4"
                        step="0.1"
                        inputmode="decimal"
                        value={headingsFontSizeEm}
                        on:change={updateHeadingsFontSize}
                    />
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetHeadingsFontSize}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </label>
        </div>
    </div>
{/if}
