<script lang="ts">
    import { Printer } from 'lucide-svelte';

    export let show = false;
    export let showTrigger = true;
    export let exportMode: 'png-square' | 'png-screen' | 'pdf-a4' =
        'png-screen';
    export let includeSidebarInPngScreen = true;

    export let toggle: () => void;
    export let setPngSquareMode: () => void;
    export let setPngScreenMode: () => void;
    export let setPdfMode: () => void;
    export let toggleIncludeSidebarInPngScreen: () => void;
    export let canApplyLastExportPreset = false;
    export let applyLastExportPreset: () => void;
    export let exportCurrentFile: () => Promise<void>;
    export let exportActionLabel = '导出文件';
</script>

{#if showTrigger}
    <button class="view-options-menu__item" on:click={toggle}>
        <div class="view-options-menu__icon">
            <Printer class="view-options-menu__icon-svg" size={18} />
        </div>
        <div class="view-options-menu__content">
            <div class="view-options-menu__label">导出模式</div>
            <div class="view-options-menu__desc">可按自定义页面大小进行导出</div>
        </div>
    </button>
{/if}

{#if show}
    <div class="view-options-menu__submenu">
        <div class="view-options-menu__subsection">
            <button
                class="view-options-menu__subitem"
                on:click={applyLastExportPreset}
                disabled={!canApplyLastExportPreset}
            >
                采用上一次导出设置
            </button>
        </div>

        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">导出分享用 PNG</div>
            <div class="view-options-menu__row view-options-menu__row--inline">
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-export-mode-png"
                        checked={exportMode === 'png-square'}
                        on:change={setPngSquareMode}
                        on:click={setPngSquareMode}
                    />
                    <span>仅导出正方形九宫格（自动等比留白）</span>
                </label>
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-export-mode-png"
                        checked={exportMode === 'png-screen'}
                        on:change={setPngScreenMode}
                        on:click={setPngScreenMode}
                    />
                    <span>导出屏幕视图内容，可包含侧边栏</span>
                </label>
            </div>
            <div class="view-options-menu__row">
                <label class="view-options-menu__inline-option">
                    <input
                        type="checkbox"
                        checked={includeSidebarInPngScreen}
                        disabled={exportMode !== 'png-screen'}
                        on:change={toggleIncludeSidebarInPngScreen}
                    />
                    <span>包含侧边栏（屏幕视图）</span>
                </label>
            </div>
        </div>

        <div class="view-options-menu__subsection">
            <div class="view-options-menu__subsection-title">导出打印用 PDF</div>
            <div class="view-options-menu__row view-options-menu__row--inline">
                <label class="view-options-menu__inline-option">
                    <input
                        type="radio"
                        name="mandala-export-mode-pdf"
                        checked={exportMode === 'pdf-a4'}
                        on:change={setPdfMode}
                        on:click={setPdfMode}
                    />
                    <span>导出 A4 打印页面（推荐表格风格）</span>
                </label>
            </div>
        </div>

        <button class="view-options-menu__subitem" on:click={exportCurrentFile}>
            {exportActionLabel}
        </button>
    </div>
{/if}
