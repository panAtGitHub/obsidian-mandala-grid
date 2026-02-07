<script lang="ts">
    import { Printer } from 'lucide-svelte';
    import { Notice } from 'obsidian';
    import type { SquareExportMode } from 'src/stores/settings/settings-type';

    export let isMobile = false;
    export let show = false;
    export let a4Mode = false;
    export let exportSquareSize = false;
    export let squareExportMode: SquareExportMode = 'contain';
    export let squareExportCanvasSize = 1600;
    export let squareExportPadding = 0;
    export let squareExportManualScale = 1;
    export let squareExportOffsetX = 0;
    export let squareExportOffsetY = 0;
    export let previewSourceWidth = 1;
    export let previewSourceHeight = 1;

    export let toggle: () => void;
    export let setPngSquareMode: () => void;
    export let setPngScreenMode: () => void;
    export let setPdfMode: () => void;
    export let exportCurrentFile: () => Promise<void>;
    export let setSquareExportMode: (mode: SquareExportMode) => void;
    export let setSquareExportCanvasSize: (size: number) => void;
    export let setSquareExportPadding: (padding: number) => void;
    export let setSquareExportManualScale: (scale: number) => void;
    export let setSquareExportOffsetX: (x: number) => void;
    export let setSquareExportOffsetY: (y: number) => void;
    export let resetSquareExportManualTransform: () => void;

    const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));

    const toNumber = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return null;
        const value = Number(target.value);
        return Number.isFinite(value) ? value : null;
    };

    const onCanvasSizeInput = (event: Event) => {
        const value = toNumber(event);
        if (value === null) return;
        setSquareExportCanvasSize(clamp(Math.round(value), 512, 4096));
    };

    const onPaddingInput = (event: Event) => {
        const value = toNumber(event);
        if (value === null) return;
        setSquareExportPadding(clamp(Math.round(value), 0, 240));
    };

    const onManualScaleInput = (event: Event) => {
        const value = toNumber(event);
        if (value === null) return;
        setSquareExportManualScale(clamp(value, 0.2, 3));
    };

    const onManualOffsetXInput = (event: Event) => {
        const value = toNumber(event);
        if (value === null) return;
        setSquareExportOffsetX(clamp(value, -50, 50));
    };

    const onManualOffsetYInput = (event: Event) => {
        const value = toNumber(event);
        if (value === null) return;
        setSquareExportOffsetY(clamp(value, -50, 50));
    };

    const toggleWithMobileGuard = () => {
        if (isMobile) {
            new Notice('移动端不支持导出，请在桌面端操作');
            return;
        }
        toggle();
    };

    $: sourceW = Math.max(1, previewSourceWidth);
    $: sourceH = Math.max(1, previewSourceHeight);
    $: sourceAspect = sourceW / sourceH;
    $: sourcePreviewW = sourceAspect >= 1 ? 100 : sourceAspect * 100;
    $: sourcePreviewH = sourceAspect >= 1 ? (1 / sourceAspect) * 100 : 100;
    $: previewPaddingPercent = clamp(
        (squareExportPadding / Math.max(1, squareExportCanvasSize)) * 100,
        0,
        45,
    );
    $: availablePreview = 100 - previewPaddingPercent * 2;
    $: containScale = Math.min(
        availablePreview / sourcePreviewW,
        availablePreview / sourcePreviewH,
    );
    $: coverScale = Math.max(
        availablePreview / sourcePreviewW,
        availablePreview / sourcePreviewH,
    );
    $: baseScale = squareExportMode === 'cover' ? coverScale : containScale;
    $: previewScale =
        squareExportMode === 'manual'
            ? baseScale * squareExportManualScale
            : baseScale;
    $: previewTranslateX =
        (100 - sourcePreviewW * previewScale) / 2 +
        (squareExportMode === 'manual' ? squareExportOffsetX : 0);
    $: previewTranslateY =
        (100 - sourcePreviewH * previewScale) / 2 +
        (squareExportMode === 'manual' ? squareExportOffsetY : 0);
</script>

<button class="view-options-menu__item" on:click={toggleWithMobileGuard}>
    <div class="view-options-menu__icon">
        <Printer class="view-options-menu__icon-svg" size={18} />
    </div>
    <div class="view-options-menu__content">
        <div class="view-options-menu__label">导出模式</div>
        <div class="view-options-menu__desc">可按自定义页面大小进行导出</div>
    </div>
</button>

{#if show}
    <div class="view-options-menu__submenu">
        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">导出分享用 PNG</div>
            <div class="view-options-menu__row view-options-menu__row--inline">
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-export-mode-png"
                        checked={!a4Mode && exportSquareSize}
                        on:change={setPngSquareMode}
                    />
                    <span>仅导出正方形九宫格</span>
                </label>
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-export-mode-png"
                        checked={!a4Mode && !exportSquareSize}
                        on:change={setPngScreenMode}
                    />
                    <span>导出屏幕视图内容，可包含侧边栏</span>
                </label>
            </div>
        </div>

        {#if !a4Mode && exportSquareSize}
            <div class="view-options-menu__subsection">
                <div class="view-options-menu__subsection-title">
                    正方形导出内容缩放方式
                </div>
                <div class="view-options-menu__row view-options-menu__row--inline">
                    <label class="view-options-menu__inline-option">
                        <input
                            type="radio"
                            name="mandala-square-export-mode"
                            checked={squareExportMode === 'contain'}
                            on:change={() => setSquareExportMode('contain')}
                        />
                        <span>等比留白（推荐）</span>
                    </label>
                    <label class="view-options-menu__inline-option">
                        <input
                            type="radio"
                            name="mandala-square-export-mode"
                            checked={squareExportMode === 'cover'}
                            on:change={() => setSquareExportMode('cover')}
                        />
                        <span>填满裁切</span>
                    </label>
                    <label class="view-options-menu__inline-option">
                        <input
                            type="radio"
                            name="mandala-square-export-mode"
                            checked={squareExportMode === 'manual'}
                            on:change={() => setSquareExportMode('manual')}
                        />
                        <span>手动微调</span>
                    </label>
                </div>

                <div class="view-options-menu__row view-options-menu__row--inline">
                    <label class="view-options-menu__inline-option">
                        <span>画布尺寸(px)</span>
                        <input
                            class="view-options-menu__number-input"
                            type="number"
                            min="512"
                            max="4096"
                            step="64"
                            value={squareExportCanvasSize}
                            on:change={onCanvasSizeInput}
                        />
                    </label>
                    <label class="view-options-menu__inline-option">
                        <span>内边距(px)</span>
                        <input
                            class="view-options-menu__number-input"
                            type="number"
                            min="0"
                            max="240"
                            step="2"
                            value={squareExportPadding}
                            on:change={onPaddingInput}
                        />
                    </label>
                </div>

                {#if squareExportMode === 'manual'}
                    <div
                        class="view-options-menu__row view-options-menu__row--inline"
                    >
                        <label class="view-options-menu__inline-option">
                            <span>缩放倍率</span>
                            <input
                                class="view-options-menu__number-input"
                                type="number"
                                min="0.2"
                                max="3"
                                step="0.1"
                                value={squareExportManualScale}
                                on:change={onManualScaleInput}
                            />
                        </label>
                        <label class="view-options-menu__inline-option">
                            <span>X 偏移(%)</span>
                            <input
                                class="view-options-menu__number-input"
                                type="number"
                                min="-50"
                                max="50"
                                step="1"
                                value={squareExportOffsetX}
                                on:change={onManualOffsetXInput}
                            />
                        </label>
                        <label class="view-options-menu__inline-option">
                            <span>Y 偏移(%)</span>
                            <input
                                class="view-options-menu__number-input"
                                type="number"
                                min="-50"
                                max="50"
                                step="1"
                                value={squareExportOffsetY}
                                on:change={onManualOffsetYInput}
                            />
                        </label>
                        <button
                            class="view-options-menu__subitem view-options-menu__subitem--ghost"
                            on:click={resetSquareExportManualTransform}
                        >
                            重置微调
                        </button>
                    </div>
                {/if}

                <div class="square-export-preview">
                    <div class="square-export-preview__title">导出构图预览</div>
                    <div class="square-export-preview__canvas">
                        <div
                            class="square-export-preview__safe-area"
                            style={`inset: ${previewPaddingPercent}%;`}
                        />
                        <div
                            class="square-export-preview__source"
                            style={`width:${sourcePreviewW}%;height:${sourcePreviewH}%;transform: translate(${previewTranslateX}%, ${previewTranslateY}%) scale(${previewScale});`}
                        />
                    </div>
                    <div class="square-export-preview__desc">
                        源内容比例 {sourceW.toFixed(0)} : {sourceH.toFixed(0)}
                    </div>
                </div>
            </div>
        {/if}

        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">导出打印用 PDF</div>
            <div class="view-options-menu__row view-options-menu__row--inline">
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-export-mode-pdf"
                        checked={a4Mode}
                        on:change={setPdfMode}
                    />
                    <span>导出 A4 打印页面（推荐表格风格）</span>
                </label>
            </div>
        </div>

        <button class="view-options-menu__subitem" on:click={exportCurrentFile}>
            导出文件
        </button>
    </div>
{/if}

<style>
    .view-options-menu__number-input {
        width: 92px;
        margin-left: 6px;
    }

    .view-options-menu__subitem--ghost {
        height: 30px;
        min-height: 30px;
        padding: 0 10px;
        margin-left: auto;
        width: auto;
    }

    .square-export-preview {
        margin-top: 10px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 10px;
        padding: 10px;
        background: var(--background-primary-alt);
    }

    .square-export-preview__title {
        font-size: 12px;
        color: var(--text-muted);
        margin-bottom: 8px;
    }

    .square-export-preview__canvas {
        position: relative;
        width: 180px;
        aspect-ratio: 1;
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        background: var(--background-primary);
        overflow: hidden;
    }

    .square-export-preview__safe-area {
        position: absolute;
        border: 1px dashed var(--text-muted);
        pointer-events: none;
        z-index: 2;
    }

    .square-export-preview__source {
        position: absolute;
        left: 0;
        top: 0;
        transform-origin: top left;
        border: 1px solid var(--interactive-accent);
        background: color-mix(
            in srgb,
            var(--interactive-accent) 22%,
            transparent
        );
    }

    .square-export-preview__desc {
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-muted);
    }
</style>
