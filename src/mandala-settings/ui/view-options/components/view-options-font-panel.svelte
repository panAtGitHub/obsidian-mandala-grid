<script lang="ts">
    import { RotateCcw, Type } from 'lucide-svelte';

    export let isMobile = false;
    export let show = false;
    export let showTrigger = true;
    export let panelTitle = '';
    export let panelDescription = '';
    export let gridSectionTitle = '';
    export let headingsSectionTitle =
        '标题字体大小（em）（可理解为正文字体的放大倍数）';

    export let fontSize3x3 = 16;
    export let fontSize9x9 = 11;
    export let fontSize7x9 = 11;
    export let fontSizeSidebar = 16;
    export let fontSizeCellPreview = 22;
    export let headingsFontSizeEm = 1.8;
    export let weekPlanEnabled = true;
    export let showCellQuickPreviewDialog = true;

    export let toggle: () => void;
    export let stepFontSize3x3: (current: number, delta: number) => void;
    export let updateFontSize3x3: (event: Event) => void;
    export let resetFontSize3x3: () => void;

    export let stepFontSize9x9: (current: number, delta: number) => void;
    export let updateFontSize9x9: (event: Event) => void;
    export let resetFontSize9x9: () => void;

    export let stepFontSize7x9: (current: number, delta: number) => void;
    export let updateFontSize7x9: (event: Event) => void;
    export let resetFontSize7x9: () => void;

    export let stepFontSizeSidebar: (current: number, delta: number) => void;
    export let updateFontSizeSidebar: (event: Event) => void;
    export let resetFontSizeSidebar: () => void;

    export let stepFontSizeCellPreview: (
        current: number,
        delta: number,
    ) => void;
    export let updateFontSizeCellPreview: (event: Event) => void;
    export let resetFontSizeCellPreview: () => void;

    export let stepHeadingsFontSize: (current: number, delta: number) => void;
    export let updateHeadingsFontSize: (event: Event) => void;
    export let resetHeadingsFontSize: () => void;

    let resolvedPanelTitle = '';
    let resolvedPanelDescription = '';
    let resolvedGridSectionTitle = '';

    $: resolvedPanelTitle = panelTitle || `字体设置（${isMobile ? '手机端' : 'PC端'}）`;
    $: resolvedPanelDescription =
        panelDescription ||
        `对 3x3 视图、9x9 视图、周计划视图、侧边栏${showCellQuickPreviewDialog ? '、快速预览浮层' : ''} 字体进行调整`;
    $: resolvedGridSectionTitle =
        gridSectionTitle || `格子字体大小（${isMobile ? '手机端' : 'PC端'}）`;
</script>

{#if showTrigger}
    <button class="view-options-menu__item" on:click={toggle}>
        <div class="view-options-menu__icon">
            <Type class="view-options-menu__icon-svg" size={18} />
        </div>
        <div class="view-options-menu__content">
            <div class="view-options-menu__label">
                {resolvedPanelTitle}
            </div>
            <div class="view-options-menu__desc">
                {resolvedPanelDescription}
            </div>
        </div>
    </button>
{/if}

{#if show}
    <div class="view-options-menu__submenu">
        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">{resolvedGridSectionTitle}</div>

            <div class="view-options-menu__row">
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
                    {#if isMobile}
                        <span class="view-options-menu__value-readout">
                            {fontSize3x3}
                        </span>
                    {:else}
                        <input
                            type="number"
                            min="6"
                            max="36"
                            step="1"
                            value={fontSize3x3}
                            on:change={updateFontSize3x3}
                        />
                    {/if}
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetFontSize3x3}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            <div class="view-options-menu__row">
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
                    {#if isMobile}
                        <span class="view-options-menu__value-readout">
                            {fontSize9x9}
                        </span>
                    {:else}
                        <input
                            type="number"
                            min="6"
                            max="36"
                            step="1"
                            value={fontSize9x9}
                            on:change={updateFontSize9x9}
                        />
                    {/if}
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetFontSize9x9}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {#if weekPlanEnabled}
                <div class="view-options-menu__row">
                    <span>nx9视图：</span>
                    <div class="view-options-menu__range">
                        <button
                            class="view-options-menu__range-step"
                            type="button"
                            on:click={() => stepFontSize7x9(fontSize7x9, -1)}
                        >
                            -
                        </button>
                        <input
                            type="range"
                            min="6"
                            max="36"
                            step="1"
                            value={fontSize7x9}
                            on:input={updateFontSize7x9}
                        />
                        <button
                            class="view-options-menu__range-step"
                            type="button"
                            on:click={() => stepFontSize7x9(fontSize7x9, 1)}
                        >
                            +
                        </button>
                        {#if isMobile}
                            <span class="view-options-menu__value-readout">
                                {fontSize7x9}
                            </span>
                        {:else}
                            <input
                                type="number"
                                min="6"
                                max="36"
                                step="1"
                                value={fontSize7x9}
                                on:change={updateFontSize7x9}
                            />
                        {/if}
                        <button
                            class="view-options-menu__reset"
                            type="button"
                            on:click={resetFontSize7x9}
                            aria-label="重置为默认"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>
            {/if}

            <div class="view-options-menu__row">
                <span>右侧详情栏：</span>
                <div class="view-options-menu__range">
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() =>
                            stepFontSizeSidebar(fontSizeSidebar, -1)}
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
                    {#if isMobile}
                        <span class="view-options-menu__value-readout">
                            {fontSizeSidebar}
                        </span>
                    {:else}
                        <input
                            type="number"
                            min="6"
                            max="36"
                            step="1"
                            value={fontSizeSidebar}
                            on:change={updateFontSizeSidebar}
                        />
                    {/if}
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetFontSizeSidebar}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {#if showCellQuickPreviewDialog}
                <div class="view-options-menu__row">
                    <span>快速预览浮层：</span>
                    <div class="view-options-menu__range">
                        <button
                            class="view-options-menu__range-step"
                            type="button"
                            on:click={() =>
                                stepFontSizeCellPreview(
                                    fontSizeCellPreview,
                                    -1,
                                )}
                        >
                            -
                        </button>
                        <input
                            type="range"
                            min="6"
                            max="36"
                            step="1"
                            value={fontSizeCellPreview}
                            on:input={updateFontSizeCellPreview}
                        />
                        <button
                            class="view-options-menu__range-step"
                            type="button"
                            on:click={() =>
                                stepFontSizeCellPreview(fontSizeCellPreview, 1)}
                        >
                            +
                        </button>
                        {#if isMobile}
                            <span class="view-options-menu__value-readout">
                                {fontSizeCellPreview}
                            </span>
                        {:else}
                            <input
                                type="number"
                                min="6"
                                max="36"
                                step="1"
                                value={fontSizeCellPreview}
                                on:change={updateFontSizeCellPreview}
                            />
                        {/if}
                        <button
                            class="view-options-menu__reset"
                            type="button"
                            on:click={resetFontSizeCellPreview}
                            aria-label="重置为默认"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>
            {/if}
        </div>

        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">
                {headingsSectionTitle}
            </div>
            <div class="view-options-menu__row">
                <span>H1</span>
                <div class="view-options-menu__range">
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() =>
                            stepHeadingsFontSize(headingsFontSizeEm, -0.1)}
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
                        on:click={() =>
                            stepHeadingsFontSize(headingsFontSizeEm, 0.1)}
                    >
                        +
                    </button>
                    {#if isMobile}
                        <span class="view-options-menu__value-readout">
                            {headingsFontSizeEm}
                        </span>
                    {:else}
                        <input
                            type="number"
                            min="1"
                            max="4"
                            step="0.1"
                            value={headingsFontSizeEm}
                            on:change={updateHeadingsFontSize}
                        />
                    {/if}
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetHeadingsFontSize}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
