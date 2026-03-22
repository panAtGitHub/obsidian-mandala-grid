<script lang="ts">
    import { Platform } from 'obsidian';
    import { CalendarDays } from 'lucide-svelte';
    import { flip } from 'svelte/animate';
    import MandalaCard from 'src/cell/view/components/mandala-card.svelte';
    import type { ThreeByThreeCellViewModel } from 'src/views/view-3x3/assemble-cell-view-model';
    import MandalaNavIcon from 'src/views/shared/mandala-nav-icon.svelte';

    export let cells: ThreeByThreeCellViewModel[] = [];
    export let theme = '1';
    export let animateSwap = false;
    export let show3x3SubgridNavButtons = false;
    export let hasOpenOverlayModal = false;
    export let dayPlanEnabled = false;
    export let showDayPlanTodayButton = false;
    export let dayPlanTodayTargetSection: string | null = null;
    export let activeCoreSection: string | null = null;
    export let todayButtonLabel = '';
    export let enterSubgridFromButton: (event: MouseEvent, nodeId: string) => void;
    export let exitSubgridFromButton: (event: MouseEvent) => void;
    export let focusDayPlanTodayFromButton: (event: MouseEvent) => void;
    export let getUpButtonLabel: (theme: string) => string;
    export let getDownButtonLabel: (theme: string) => string;
</script>

<div class="mandala-grid mandala-grid--3 mandala-grid--core">
    {#each cells as cell (cell.key)}
        <div
            class="mandala-cell"
            animate:flip={{
                duration: animateSwap ? 220 : 0,
            }}
        >
            {#if cell.cardViewModel}
                <MandalaCard viewModel={cell.cardViewModel} />
                {#if !Platform.isMobile && show3x3SubgridNavButtons && !hasOpenOverlayModal}
                    <div
                        class="mandala-subgrid-controls"
                        class:is-center-controls={cell.isCenter}
                        on:click|stopPropagation
                        on:mousedown|stopPropagation|preventDefault
                        on:pointerdown|stopPropagation|preventDefault
                    >
                        {#if cell.isCenter}
                            {#if theme !== '1'}
                                <button
                                    class="mandala-subgrid-btn mandala-subgrid-btn--up"
                                    type="button"
                                    aria-label={getUpButtonLabel(theme)}
                                    title={getUpButtonLabel(theme)}
                                    on:click={(event) =>
                                        exitSubgridFromButton(event)}
                                >
                                    <span class="mandala-subgrid-btn__icon">
                                        {#if theme.includes('.')}
                                            <MandalaNavIcon
                                                direction="up"
                                                size={14}
                                                strokeWidth={2.2}
                                            />
                                        {:else}
                                            <MandalaNavIcon
                                                direction="left"
                                                size={14}
                                                strokeWidth={2.2}
                                            />
                                        {/if}
                                    </span>
                                </button>
                            {/if}
                            {#if !theme.includes('.')}
                                <button
                                    class="mandala-subgrid-btn mandala-subgrid-btn--down"
                                    type="button"
                                    aria-label={getDownButtonLabel(theme)}
                                    title={getDownButtonLabel(theme)}
                                    on:click={(event) =>
                                        enterSubgridFromButton(
                                            event,
                                            cell.cardViewModel.nodeId,
                                        )}
                                >
                                    <span class="mandala-subgrid-btn__icon">
                                        {#if theme.includes('.')}
                                            <MandalaNavIcon
                                                direction="down"
                                                size={14}
                                                strokeWidth={2.2}
                                            />
                                        {:else}
                                            <MandalaNavIcon
                                                direction="right"
                                                size={14}
                                                strokeWidth={2.2}
                                            />
                                        {/if}
                                    </span>
                                </button>
                            {/if}
                            {#if dayPlanEnabled && showDayPlanTodayButton && dayPlanTodayTargetSection && activeCoreSection !== dayPlanTodayTargetSection}
                                <button
                                    class="mandala-subgrid-btn mandala-subgrid-btn--today"
                                    type="button"
                                    aria-label={todayButtonLabel}
                                    title={todayButtonLabel}
                                    on:click={(event) =>
                                        focusDayPlanTodayFromButton(event)}
                                >
                                    <span class="mandala-subgrid-btn__icon">
                                        <CalendarDays
                                            size={14}
                                            strokeWidth={2.2}
                                        />
                                    </span>
                                </button>
                            {/if}
                        {:else}
                            <button
                                class="mandala-subgrid-btn mandala-subgrid-btn--single"
                                type="button"
                                aria-label="进入子九宫"
                                on:click={(event) =>
                                    enterSubgridFromButton(
                                        event,
                                        cell.cardViewModel.nodeId,
                                    )}
                            >
                                <span class="mandala-subgrid-btn__icon">
                                    <MandalaNavIcon
                                        direction="down"
                                        size={14}
                                        strokeWidth={2.2}
                                    />
                                </span>
                            </button>
                        {/if}
                    </div>
                {/if}
            {:else}
                <div
                    class="mandala-empty"
                    style={cell.sectionBackground
                        ? `background-color: ${cell.sectionBackground};`
                        : undefined}
                >
                    {cell.section}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .mandala-grid {
        display: grid;
        grid-template-columns: repeat(3, var(--node-width));
        gap: var(--mandala-gap);
        align-items: start;
    }

    .mandala-cell {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .mandala-grid--core {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-template-rows: repeat(3, minmax(0, 1fr));
        align-items: stretch;
        justify-items: stretch;
    }

    :global(.mandala-a4-mode.is-desktop-square-layout) .mandala-grid--core {
        width: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
        height: min(
            var(--mandala-a4-content-width),
            var(--mandala-a4-content-height)
        );
    }

    :global(.mandala-white-theme) .mandala-grid--core {
        gap: 0;
        box-sizing: border-box;
    }

    :global(.mandala-white-theme) .mandala-cell {
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        box-sizing: border-box;
        overflow: hidden;
    }

    :global(.mandala-white-theme) .mandala-cell:nth-child(-n + 3) {
        border-top: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme) .mandala-cell:nth-child(3n + 1) {
        border-left: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme) .mandala-cell:nth-child(n + 7) {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme) .mandala-cell:nth-child(3n) {
        border-right: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme) .mandala-cell :global(.mandala-card) {
        border: 0 !important;
        border-left-width: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
    }

    .mandala-empty {
        width: 100%;
        height: 100%;
        min-height: 0;
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        padding: 8px;
        opacity: 0.7;
        position: relative;
        background: var(--background-primary);
        box-sizing: border-box;
    }

    .mandala-subgrid-controls {
        position: absolute;
        right: 8px;
        bottom: 8px;
        z-index: 20;
        display: flex;
        gap: 6px;
        pointer-events: auto;
    }

    .mandala-subgrid-controls.is-center-controls {
        left: 8px;
        right: 8px;
        bottom: 8px;
        display: block;
    }

    .mandala-subgrid-btn {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        box-shadow: var(--shadow-s);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        position: relative;
        z-index: 21;
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            box-shadow 120ms ease,
            transform 120ms ease;
    }

    .mandala-subgrid-btn:hover {
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
            0 0 0 1px
                color-mix(in srgb, var(--interactive-accent) 45%, transparent),
            var(--shadow-s);
        transform: translateY(-1px);
    }

    .mandala-subgrid-btn:active {
        transform: translateY(1px);
    }

    .mandala-subgrid-btn__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        line-height: 0;
    }

    .mandala-subgrid-btn__icon :global(svg),
    .mandala-subgrid-btn__icon :global(.svg-icon) {
        display: block;
        width: 14px !important;
        height: 14px !important;
        stroke-width: 2.2 !important;
    }

    .mandala-subgrid-controls.is-center-controls .mandala-subgrid-btn--up {
        position: absolute;
        left: 0;
        bottom: 0;
    }

    .mandala-subgrid-controls.is-center-controls .mandala-subgrid-btn--down {
        position: absolute;
        right: 0;
        bottom: 0;
    }

    .mandala-subgrid-controls.is-center-controls .mandala-subgrid-btn--today {
        position: absolute;
        left: calc(50% - 12px);
        bottom: 0;
    }

    :global(.mandala-root--3) .mandala-grid :global(.lng-prev) {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        overflow: auto;
    }

    :global(.mandala-root--3) :global(.editor-container) {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }
</style>
