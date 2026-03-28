<script lang="ts">
    import { Platform } from 'obsidian';
    import { CalendarDays } from 'lucide-svelte';
    import { flip } from 'svelte/animate';
    import MandalaCard from 'src/mandala-cell/view/components/mandala-card.svelte';
    import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
    import type { MandalaCardMobileDoubleClickHandler } from 'src/mandala-cell/viewmodel/controller/mandala-card-controller';
    import {
        resolveCardGridStyle,
        type ResolvedGridStyle,
    } from 'src/mandala-scenes/shared/grid-style';
    import type { ThreeByThreeCellViewModel } from 'src/mandala-scenes/view-3x3/assemble-cell-view-model';
    import MandalaNavIcon from 'src/mandala-scenes/shared/mandala-nav-icon.svelte';

    export let cells: ThreeByThreeCellViewModel[] = [];
    export let gridStyle: ResolvedGridStyle = resolveCardGridStyle({
        whiteThemeMode: false,
    });
    export let themeSnapshot: MandalaThemeSnapshot = {
        themeTone: 'light',
        themeUnderlayColor: '',
        activeThemeUnderlayColor: '',
    };
    export let theme = '1';
    export let animateSwap = false;
    export let show3x3SubgridNavButtons = false;
    export let hasOpenOverlayModal = false;
    export let dayPlanEnabled = false;
    export let showDayPlanTodayButton = false;
    export let dayPlanTodayTargetSection: string | null = null;
    export let activeCoreSection: string | null = null;
    export let todayButtonLabel = '';
    export let enterSubgridFromButton: (
        event: MouseEvent,
        nodeId: string,
    ) => void;
    export let exitSubgridFromButton: (event: MouseEvent) => void;
    export let focusDayPlanTodayFromButton: (event: MouseEvent) => void;
    export let getUpButtonLabel: (theme: string) => string;
    export let getDownButtonLabel: (theme: string) => string;
    export let onMobileCardDoubleClick: MandalaCardMobileDoubleClickHandler | null =
        null;

    $: isNestedTheme = theme.includes('.');
    $: showUpButton = theme !== '1';
    $: showDownButton = !isNestedTheme;
    $: upButtonLabel = getUpButtonLabel(theme);
    $: downButtonLabel = getDownButtonLabel(theme);
    $: upButtonDirection = isNestedTheme ? 'up' : 'left';
    $: downButtonDirection = isNestedTheme ? 'down' : 'right';
</script>

<div
    class="mandala-grid mandala-grid--3 mandala-grid--core mandala-card-grid"
    class:is-compact={gridStyle.compactMode}
>
    {#each cells as cell (cell.key)}
        <div
            class="mandala-cell mandala-card-grid__cell"
            class:mandala-card-grid__cell--card={!!cell.cardViewModel}
            class:mandala-card-grid__cell--empty={!cell.cardViewModel}
            class:is-top-edge={cell.isTopEdge}
            class:is-bottom-edge={cell.isBottomEdge}
            class:is-left-edge={cell.isLeftEdge}
            class:is-right-edge={cell.isRightEdge}
            animate:flip={{
                duration: animateSwap ? 220 : 0,
            }}
            style={!cell.cardViewModel && cell.sectionBackground
                ? `background-color: ${cell.sectionBackground};`
                : undefined}
        >
            {#if cell.cardViewModel}
                <MandalaCard
                    viewModel={cell.cardViewModel}
                    uiState={cell.cardUiState}
                    {themeSnapshot}
                    onMobileDoubleClick={onMobileCardDoubleClick}
                />
                {#if !Platform.isMobile && show3x3SubgridNavButtons && !hasOpenOverlayModal}
                    <div
                        class="mandala-subgrid-controls"
                        class:is-center-controls={cell.isCenter}
                        on:click|stopPropagation
                        on:mousedown|stopPropagation|preventDefault
                        on:pointerdown|stopPropagation|preventDefault
                    >
                        {#if cell.isCenter}
                            {#if showUpButton}
                                <button
                                    class="mandala-subgrid-btn mandala-subgrid-btn--up"
                                    type="button"
                                    aria-label={upButtonLabel}
                                    title={upButtonLabel}
                                    on:click={(event) =>
                                        exitSubgridFromButton(event)}
                                >
                                    <span class="mandala-subgrid-btn__icon">
                                        <MandalaNavIcon
                                            direction={upButtonDirection}
                                            size={14}
                                            strokeWidth={2.2}
                                        />
                                    </span>
                                </button>
                            {/if}
                            {#if showDownButton}
                                <button
                                    class="mandala-subgrid-btn mandala-subgrid-btn--down"
                                    type="button"
                                    aria-label={downButtonLabel}
                                    title={downButtonLabel}
                                    on:click={(event) =>
                                        enterSubgridFromButton(
                                            event,
                                            cell.cardViewModel.nodeId,
                                        )}
                                >
                                    <span class="mandala-subgrid-btn__icon">
                                        <MandalaNavIcon
                                            direction={downButtonDirection}
                                            size={14}
                                            strokeWidth={2.2}
                                        />
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
                <div class="mandala-card-grid__empty">
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
        align-items: start;
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
        background: var(--background-modifier-hover);
        border-color: var(--background-modifier-border-hover);
        box-shadow:
            var(--shadow-s),
            0 0 0 1px var(--background-modifier-border-hover);
    }

    .mandala-subgrid-btn:active {
        transform: translateY(1px);
    }

    .mandala-subgrid-btn:focus-visible {
        outline: 2px solid var(--interactive-accent);
        outline-offset: 2px;
    }

    .mandala-subgrid-btn--up {
        position: absolute;
        left: 0;
        bottom: 0;
    }

    .mandala-subgrid-btn--down {
        position: absolute;
        right: 0;
        bottom: 0;
    }

    .mandala-subgrid-btn--today {
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
    }

    .mandala-subgrid-btn--today:active {
        transform: translateX(-50%) translateY(1px);
    }

    .mandala-subgrid-btn__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }

    .mandala-card-grid__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        color: var(--text-faint);
    }
</style>
