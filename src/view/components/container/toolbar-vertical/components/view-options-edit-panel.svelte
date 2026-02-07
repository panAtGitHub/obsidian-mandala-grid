<script lang="ts">
    import { Grid3x3, RotateCcw } from 'lucide-svelte';
    import ColorSwatchInput from '../color-swatch-input.svelte';

    export let show = false;
    export let whiteThemeMode = false;
    export let showImmersiveOptions = false;
    export let showPanoramaOptions = false;

    export let containerBg = '';
    export let activeBranchBg = '';
    export let activeBranchColor = '';
    export let inactiveNodeOpacity = 0;

    export let borderOpacity = 0;
    export let backgroundMode: 'none' | 'custom' | 'gray' = 'none';
    export let sectionColorOpacity = 0;
    export let squareLayout = false;
    export let cardsGap = 0;
    export let gridOrientation: 'south-start' | 'left-to-right' | 'bottom-to-top' =
        'south-start';

    export let toggle: () => void;
    export let updateWhiteThemeMode: (enabled: boolean) => void;
    export let toggleImmersiveOptions: () => void;
    export let togglePanoramaOptions: () => void;

    export let updateContainerBg: (event: Event) => void;
    export let resetContainerBg: () => void;
    export let updateActiveBranchBg: (event: Event) => void;
    export let resetActiveBranchBg: () => void;
    export let updateActiveBranchColor: (event: Event) => void;
    export let resetActiveBranchColor: () => void;

    export let stepInactiveOpacity: (current: number, delta: number) => void;
    export let updateInactiveNodeOpacity: (event: Event) => void;
    export let resetInactiveNodeOpacity: () => void;

    export let stepBorderOpacity: (current: number, delta: number) => void;
    export let updateBorderOpacity: (event: Event) => void;

    export let updateBackgroundMode: (mode: 'none' | 'custom' | 'gray') => void;
    export let stepOpacity: (current: number, delta: number) => void;
    export let updateSectionColorOpacity: (event: Event) => void;

    export let updateSquareLayout: (enabled: boolean) => void;
    export let stepCardsGap: (current: number, delta: number) => void;
    export let updateCardsGap: (event: Event) => void;
    export let resetCardsGap: () => void;

    export let updateGridOrientation: (
        orientation: 'south-start' | 'left-to-right' | 'bottom-to-top',
    ) => void;
</script>

<button class="view-options-menu__item" on:click={toggle}>
    <div class="view-options-menu__icon">
        <Grid3x3 class="view-options-menu__icon-svg" size={18} />
    </div>
    <div class="view-options-menu__content">
        <div class="view-options-menu__label">编辑模式</div>
        <div class="view-options-menu__desc">背景与布局</div>
    </div>
</button>

{#if show}
    <div class="view-options-menu__submenu">
        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">格子风格</div>
            <div class="view-options-menu__row view-options-menu__row--inline">
                <div class="view-options-menu__inline-group">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="radio"
                            name="mandala-background"
                            checked={!whiteThemeMode}
                            on:change={() => updateWhiteThemeMode(false)}
                        />
                        <span>卡片风格，沉浸模式</span>
                    </label>
                    {#if !whiteThemeMode}
                        <button
                            class="view-options-menu__inline-toggle view-options-menu__inline-toggle--text"
                            type="button"
                            on:click|stopPropagation={toggleImmersiveOptions}
                            aria-label="展开沉浸模式设置"
                        >
                            更多设置
                        </button>
                    {/if}
                </div>
                <div class="view-options-menu__inline-group">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="radio"
                            name="mandala-background"
                            checked={whiteThemeMode}
                            on:change={() => updateWhiteThemeMode(true)}
                        />
                        <span>表格风格，全景模式</span>
                    </label>
                    {#if whiteThemeMode}
                        <button
                            class="view-options-menu__inline-toggle view-options-menu__inline-toggle--text"
                            type="button"
                            on:click|stopPropagation={togglePanoramaOptions}
                            aria-label="展开全景模式设置"
                        >
                            更多设置
                        </button>
                    {/if}
                </div>
            </div>

            {#if !whiteThemeMode && showImmersiveOptions}
                <div class="view-options-menu__submenu view-options-menu__submenu--nested">
                    <div class="view-options-menu__subsection">
                        <label class="view-options-menu__row">
                            <span>网格容器背景颜色</span>
                            <div class="view-options-menu__row-controls">
                                <ColorSwatchInput
                                    value={containerBg}
                                    onInput={updateContainerBg}
                                    ariaLabel="选择网格容器背景颜色"
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetContainerBg}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>
                        <label class="view-options-menu__row">
                            <span>活跃格子背景颜色</span>
                            <div class="view-options-menu__row-controls">
                                <ColorSwatchInput
                                    value={activeBranchBg}
                                    onInput={updateActiveBranchBg}
                                    ariaLabel="选择活跃格子背景颜色"
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetActiveBranchBg}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>
                        <label class="view-options-menu__row">
                            <span>活跃格子文字颜色</span>
                            <div class="view-options-menu__row-controls">
                                <ColorSwatchInput
                                    value={activeBranchColor}
                                    onInput={updateActiveBranchColor}
                                    ariaLabel="选择活跃格子文字颜色"
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetActiveBranchColor}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>
                        <label class="view-options-menu__row">
                            <span>非活跃格子透明度</span>
                            <div class="view-options-menu__range">
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepInactiveOpacity(inactiveNodeOpacity, -5)}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={inactiveNodeOpacity}
                                    on:input={updateInactiveNodeOpacity}
                                />
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepInactiveOpacity(inactiveNodeOpacity, 5)}
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={inactiveNodeOpacity}
                                    on:change={updateInactiveNodeOpacity}
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetInactiveNodeOpacity}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>
                    </div>
                </div>
            {/if}

            {#if whiteThemeMode && showPanoramaOptions}
                <div class="view-options-menu__submenu view-options-menu__submenu--nested">
                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            线框选项
                        </div>
                        <label class="view-options-menu__row">
                            <span>线框透明度</span>
                            <div class="view-options-menu__range">
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() => stepBorderOpacity(borderOpacity, -5)}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={borderOpacity}
                                    on:input={updateBorderOpacity}
                                />
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() => stepBorderOpacity(borderOpacity, 5)}
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={borderOpacity}
                                    on:input={updateBorderOpacity}
                                />
                            </div>
                        </label>
                    </div>
                </div>
            {/if}
        </div>

        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">背景色选项</div>
            <div class="view-options-menu__row view-options-menu__row--inline">
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-background-color"
                        checked={backgroundMode === 'none'}
                        on:change={() => updateBackgroundMode('none')}
                    />
                    <span>无背景色</span>
                </label>
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-background-color"
                        checked={backgroundMode === 'custom'}
                        on:change={() => updateBackgroundMode('custom')}
                    />
                    <span>色块卡片</span>
                </label>
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-background-color"
                        checked={backgroundMode === 'gray'}
                        on:change={() => updateBackgroundMode('gray')}
                    />
                    <span>间隔灰色色块</span>
                </label>
            </div>
            <label class="view-options-menu__row">
                <span>背景色透明度</span>
                <div class="view-options-menu__range">
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        disabled={backgroundMode === 'none'}
                        on:click={() => stepOpacity(sectionColorOpacity, -5)}
                    >
                        -
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={sectionColorOpacity}
                        on:input={updateSectionColorOpacity}
                        disabled={backgroundMode === 'none'}
                    />
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        disabled={backgroundMode === 'none'}
                        on:click={() => stepOpacity(sectionColorOpacity, 5)}
                    >
                        +
                    </button>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={sectionColorOpacity}
                        on:change={updateSectionColorOpacity}
                        disabled={backgroundMode === 'none'}
                    />
                </div>
            </label>
        </div>

        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">格子形状布局</div>
            <div class="view-options-menu__row view-options-menu__row--inline">
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-square-layout"
                        checked={!squareLayout}
                        on:change={() => updateSquareLayout(false)}
                    />
                    <span>自适应布局</span>
                </label>
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-square-layout"
                        checked={squareLayout}
                        on:change={() => updateSquareLayout(true)}
                    />
                    <span>正方形布局</span>
                </label>
            </div>
            <label class="view-options-menu__row">
                <span>网格间距</span>
                <div class="view-options-menu__range">
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepCardsGap(cardsGap, -2)}
                    >
                        -
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        step="2"
                        value={cardsGap}
                        on:input={updateCardsGap}
                    />
                    <button
                        class="view-options-menu__range-step"
                        type="button"
                        on:click={() => stepCardsGap(cardsGap, 2)}
                    >
                        +
                    </button>
                    <input
                        type="number"
                        min="0"
                        max="20"
                        step="2"
                        value={cardsGap}
                        on:change={updateCardsGap}
                    />
                    <button
                        class="view-options-menu__reset"
                        type="button"
                        on:click={resetCardsGap}
                        aria-label="重置为默认"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            </label>
        </div>

        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">九宫格方位布局</div>
            <div class="view-options-menu__row view-options-menu__row--inline">
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-grid-orientation"
                        checked={gridOrientation === 'south-start'}
                        on:change={() => updateGridOrientation('south-start')}
                    />
                    <span>从南开始</span>
                </label>
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-grid-orientation"
                        checked={gridOrientation === 'left-to-right'}
                        on:change={() => updateGridOrientation('left-to-right')}
                    />
                    <span>从左到右（Z形）</span>
                </label>
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-grid-orientation"
                        checked={gridOrientation === 'bottom-to-top'}
                        on:change={() => updateGridOrientation('bottom-to-top')}
                    />
                    <span>从下到上（S形）</span>
                </label>
            </div>
        </div>
    </div>
{/if}
