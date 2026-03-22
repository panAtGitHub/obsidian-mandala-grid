<script lang="ts">
    import { Platform } from 'obsidian';
    import type {
        SimpleSummaryActiveCell,
        SimpleSummaryCellModel,
    } from 'src/cell/model/simple-summary-cell-model';
    import type { MandalaSwapInteractionState } from 'src/view/helpers/mandala/mandala-swap';
    import SimpleSummaryCell from 'src/cell/view/components/simple-summary-cell.svelte';
    import MandalaNavIcon from 'src/views/shared/mandala-nav-icon.svelte';

    export let cells: SimpleSummaryCellModel[] = [];
    export let activeNodeId: string | null;
    export let activeCell: SimpleSummaryActiveCell;
    export let showTitleOnly = false;
    export let swapState: MandalaSwapInteractionState;
    export let borderOpacity = 100;
    export let bodyLineClamp = 3;
    export let showParallelNavButtons = false;
    export let hasOpenOverlayModal = false;
    export let currentCoreNumber = 1;
    export let gridEl: HTMLDivElement | null = null;
    export let jumpToPrevCore: (event: MouseEvent) => void;
    export let jumpToNextCore: (event: MouseEvent) => void;
</script>

<div class="simple-9x9-shell">
    <div
        class="simple-9x9-grid"
        style={`--mandala-border-opacity: ${borderOpacity}%; --mandala-body-lines: ${bodyLineClamp};`}
        bind:this={gridEl}
    >
        {#each cells as cell (`${cell.row}-${cell.col}`)}
            <SimpleSummaryCell
                {cell}
                {activeNodeId}
                {activeCell}
                {showTitleOnly}
                {swapState}
            />
        {/each}
    </div>

    {#if !Platform.isMobile && showParallelNavButtons && !hasOpenOverlayModal}
        {#if currentCoreNumber > 1}
            <button
                class="parallel-nav-button parallel-nav-button--left"
                type="button"
                aria-label="切换到上一个平行九宫格"
                on:click={jumpToPrevCore}
            >
                <span class="parallel-nav-button__icon">
                    <MandalaNavIcon
                        direction="left"
                        size={16}
                        strokeWidth={2.3}
                    />
                </span>
            </button>
        {/if}
        <button
            class="parallel-nav-button parallel-nav-button--right"
            type="button"
            aria-label="切换到下一个平行九宫格"
            on:click={jumpToNextCore}
        >
            <span class="parallel-nav-button__icon">
                <MandalaNavIcon
                    direction="right"
                    size={16}
                    strokeWidth={2.3}
                />
            </span>
        </button>
    {/if}
</div>

<style>
    .simple-9x9-shell {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .simple-9x9-grid {
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        grid-template-rows: repeat(9, 1fr);
        width: 100%;
        height: 100%;
        gap: 0;
        padding: 0;
        box-sizing: border-box;
        background-color: var(--background-secondary);
        font-size: var(--mandala-font-9x9, 11px);
        --mandala-border-opacity: 100%;
        --mandala-gray-block-base: color-mix(
            in srgb,
            var(--background-modifier-border) 70%,
            var(--background-primary)
        );
        --mandala-border-color: color-mix(
            in srgb,
            var(--text-normal) var(--mandala-border-opacity),
            transparent
        );
        --mandala-selection-color: color-mix(
            in srgb,
            var(--mandala-color-selection) var(--mandala-border-opacity),
            transparent
        );
    }

    .parallel-nav-button {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 20;
        width: 30px;
        height: 30px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 999px;
        background: var(--background-primary);
        color: var(--text-normal);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-s);
        cursor: pointer;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            box-shadow 120ms ease,
            transform 120ms ease;
    }

    .parallel-nav-button:hover {
        background: color-mix(
            in srgb,
            var(--background-primary-alt) 75%,
            var(--interactive-accent) 25%
        );
        border-color: color-mix(
            in srgb,
            var(--interactive-accent) 55%,
            var(--background-modifier-border) 45%
        );
        box-shadow:
            0 0 0 1px color-mix(
                in srgb,
                var(--interactive-accent) 45%,
                transparent
            ),
            var(--shadow-s);
        transform: translate(-50%, -50%) translateY(-1px);
    }

    .parallel-nav-button:active {
        transform: translate(-50%, -50%) scale(0.96);
    }

    .parallel-nav-button--left {
        left: 33.3333%;
    }

    .parallel-nav-button--right {
        left: 66.6667%;
    }

    .parallel-nav-button__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        line-height: 0;
    }

    .parallel-nav-button__icon :global(svg) {
        display: block;
        width: 16px !important;
        height: 16px !important;
        stroke-width: 2.3 !important;
    }
</style>
