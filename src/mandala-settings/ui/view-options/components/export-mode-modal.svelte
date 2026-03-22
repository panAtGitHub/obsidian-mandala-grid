<script lang="ts">
    import { X } from 'lucide-svelte';
    import Portal from 'src/shared/ui/portal.svelte';
    import ViewOptionsEditPanel from './view-options-edit-panel.svelte';

    export type ExportMode = 'png-square' | 'png-screen' | 'pdf-a4';

    export let open = false;
    export let isMobile = false;
    export let inlineStyle: string | undefined = undefined;
    export let exportMode: ExportMode = 'png-screen';
    export let exportModeLabel = '';
    export let exportModeHint = '';
    export let appearanceStyleLabel = '';
    export let appearanceShapeLabel = '';
    export let appearanceBackgroundLabel = '';
    export let appearanceOrientationLabel = '';
    export let includeSidebarInPngScreen = true;
    export let a4Orientation: 'portrait' | 'landscape' = 'portrait';
    export let showExportStyleDetails = false;
    export let squareLayout = false;
    export let editPanelProps: Record<string, unknown> = {};
    export let canApplyLastExportPreset = false;
    export let exportActionLabel = '导出文件';

    export let onClose: () => void;
    export let onStartDrag: (event: MouseEvent | TouchEvent) => void;
    export let onSetExportMode: (mode: ExportMode) => void;
    export let onToggleIncludeSidebar: () => void;
    export let onUpdateA4Orientation: (event: Event) => void;
    export let onToggleStyleDetails: () => void;
    export let onApplyLastExportPreset: () => void;
    export let onExportCurrentFile: () => Promise<void>;
</script>

{#if open}
    <Portal>
        <div class="export-mode-overlay" />
        <div
            class="mandala-modal export-mode-modal"
            class:is-mobile={isMobile}
            style={inlineStyle}
            on:mousedown|stopPropagation
            on:touchstart|stopPropagation
        >
            <div
                class="view-options-menu__header export-mode-modal__header"
                on:mousedown={onStartDrag}
                on:touchstart={onStartDrag}
            >
                <span class="view-options-menu__title">
                    导出模式（临时会话，按住标题可移动）
                </span>
                <button class="view-options-menu__close" on:click={onClose}>
                    <X class="icon" size={16} />
                </button>
            </div>
            <div class="view-options-menu__items">
                <div class="view-options-menu__submenu export-mode-flow">
                    <div class="view-options-menu__note">
                        仅本次导出生效，关闭后恢复编辑状态。
                    </div>
                    <div class="view-options-menu__subsection-title">
                        1. 导出目标
                    </div>
                    <div class="export-target-tabs">
                        <button
                            class="export-target-tab"
                            class:is-active={exportMode === 'png-square'}
                            on:click={() => onSetExportMode('png-square')}
                        >
                            PNG 格子范围
                        </button>
                        <button
                            class="export-target-tab"
                            class:is-active={exportMode === 'png-screen'}
                            on:click={() => onSetExportMode('png-screen')}
                        >
                            PNG 屏幕范围
                        </button>
                        <button
                            class="export-target-tab"
                            class:is-active={exportMode === 'pdf-a4'}
                            on:click={() => onSetExportMode('pdf-a4')}
                        >
                            PDF A4
                        </button>
                    </div>
                    <div class="export-mode-status">
                        <span class="export-mode-badge">{exportModeLabel}</span>
                        <span
                            class="export-mode-badge export-mode-badge--muted"
                        >
                            {exportModeHint}
                        </span>
                    </div>
                    <div class="export-appearance-status">
                        <span
                            class="export-mode-badge export-mode-badge--muted"
                        >
                            {appearanceStyleLabel}
                        </span>
                        <span
                            class="export-mode-badge export-mode-badge--muted"
                        >
                            {appearanceShapeLabel}
                        </span>
                        <span
                            class="export-mode-badge export-mode-badge--muted"
                        >
                            {appearanceBackgroundLabel}
                        </span>
                        <span
                            class="export-mode-badge export-mode-badge--muted"
                        >
                            {appearanceOrientationLabel}
                        </span>
                    </div>
                    <div class="view-options-menu__subsection-title">
                        2. 专属选项
                    </div>
                    {#if exportMode === 'png-screen'}
                        <div class="view-options-menu__row">
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="checkbox"
                                    checked={includeSidebarInPngScreen}
                                    on:change={onToggleIncludeSidebar}
                                />
                                <span>包含侧边栏</span>
                            </label>
                        </div>
                    {:else if exportMode === 'pdf-a4'}
                        <div class="view-options-menu__row">
                            <span>A4 方向</span>
                            <select
                                value={a4Orientation}
                                on:change={onUpdateA4Orientation}
                            >
                                <option value="portrait">纵向</option>
                                <option value="landscape">横向</option>
                            </select>
                        </div>
                    {:else}
                        <div class="view-options-menu__note">
                            {squareLayout
                                ? '当前为正方形布局，按格子范围导出并自动留白。'
                                : '当前为自适应布局，按格子范围导出长方形。'}
                        </div>
                    {/if}
                    <div class="export-style-header">
                        <div class="view-options-menu__subsection-title">
                            3. 外观样式
                        </div>
                        <button
                            class="export-style-toggle"
                            on:click={onToggleStyleDetails}
                        >
                            {showExportStyleDetails ? '收起' : '展开'}
                        </button>
                    </div>
                    {#if showExportStyleDetails}
                        <div class="export-style-panel">
                            <ViewOptionsEditPanel {...editPanelProps} />
                        </div>
                    {/if}
                    <div class="export-secondary-row">
                        <button
                            class="view-options-menu__subitem"
                            on:click={onApplyLastExportPreset}
                            disabled={!canApplyLastExportPreset}
                        >
                            采用上一次导出设置
                        </button>
                        <button
                            class="view-options-menu__subitem"
                            on:click={onClose}
                        >
                            取消设置并退出
                        </button>
                    </div>
                    <button
                        class="view-options-menu__subitem export-primary-button"
                        on:click={onExportCurrentFile}
                    >
                        {exportActionLabel}
                    </button>
                </div>
            </div>
        </div>
    </Portal>
{/if}

<style>
    .export-mode-overlay {
        position: fixed;
        inset: 0;
        z-index: 1200;
        background: rgba(0, 0, 0, 0.18);
        pointer-events: none;
    }

    .export-mode-modal {
        position: fixed;
        z-index: 1201;
        right: 16px;
        top: 72px;
        width: min(420px, calc(100vw - 24px));
        max-height: calc(100vh - 96px);
    }

    :global(.is-mobile) .export-mode-modal {
        inset: 8px;
        width: auto;
        max-height: none;
    }

    .export-mode-modal__header {
        cursor: move;
        user-select: none;
        touch-action: none;
    }

    :global(.is-mobile) .export-mode-modal__header {
        cursor: default;
        touch-action: auto;
    }

    .export-mode-status {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .export-appearance-status {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .export-mode-flow {
        gap: 10px;
    }

    .export-target-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .export-target-tab {
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        border-radius: 8px;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 12px;
        color: var(--text-muted);
    }

    .export-target-tab.is-active {
        border-color: var(--interactive-accent);
        color: var(--text-normal);
        background: color-mix(
            in srgb,
            var(--interactive-accent) 12%,
            var(--background-primary)
        );
    }

    .export-style-panel {
        border: 1px solid var(--background-modifier-border);
        border-radius: 8px;
        padding: 6px 8px;
        background: var(--background-primary);
    }

    .export-style-panel :global(.view-options-menu__row) {
        justify-content: space-between;
    }

    .export-style-panel :global(.view-options-menu__row > span) {
        flex: 1 1 auto;
        min-width: 0;
        white-space: nowrap;
    }

    .export-style-panel :global(.view-options-menu__row-controls) {
        margin-left: auto;
    }

    .export-style-panel :global(.view-options-menu__range) {
        flex: 1 1 auto;
        min-width: 0;
        margin-left: auto;
        justify-content: flex-end;
    }

    .export-style-panel :global(.view-options-menu__range input[type='range']) {
        flex: 0 0 40px;
        max-width: 40px;
    }

    .export-style-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .export-style-toggle {
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        background: var(--background-primary);
        color: var(--text-muted);
        padding: 2px 8px;
        font-size: 12px;
        cursor: pointer;
    }

    .export-style-toggle:hover {
        color: var(--text-normal);
        background: var(--background-modifier-hover);
    }

    .export-secondary-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .export-primary-button {
        border-color: var(--interactive-accent);
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        font-weight: 600;
        text-align: center;
    }

    .export-primary-button:hover {
        filter: brightness(0.95);
    }

    .export-mode-badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 11px;
        color: var(--text-normal);
        background: var(--background-modifier-hover);
        border: 1px solid var(--background-modifier-border);
    }

    .export-mode-badge--muted {
        color: var(--text-muted);
    }
</style>
