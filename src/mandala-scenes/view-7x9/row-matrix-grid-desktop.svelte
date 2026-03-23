<script lang="ts">
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import MandalaCard from 'src/mandala-cell/view/components/mandala-card.svelte';
    import { setActiveCellWeek7x9 } from 'src/mandala-interaction/helpers/set-active-cell-week-7x9';
    import type { WeekPlanBaseCell } from 'src/mandala-display/logic/week-plan-context';
    import type { WeekPlanDesktopCellViewModel } from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';

    export let cells: WeekPlanDesktopCellViewModel[] = [];
    export let compactMode = false;
    export let fontVariable = '--mandala-font-7x9';

    const view = getView();

    const handleCellClick = (cell: WeekPlanBaseCell) => {
        if (!cell.nodeId) return;
        setActiveCellWeek7x9(view, { row: cell.row, col: cell.col });
    };
</script>

<div
    class="row-matrix-grid mandala-grid mandala-grid--row-matrix"
    style={`--row-matrix-font-size: var(${fontVariable}, var(--mandala-font-3x3));`}
>
    {#each cells as cell (`${cell.row}-${cell.col}`)}
        <div
            class="row-matrix-cell mandala-cell row-matrix-cell--desktop-card"
            class:is-placeholder={cell.isPlaceholder}
            class:is-empty-section={!cell.isPlaceholder &&
                !cell.nodeId &&
                !!cell.emptyLabel}
            class:is-clickable={!!cell.nodeId}
            class:is-center-column={cell.isCenterColumn}
            class:is-active-cell={cell.isActiveCell}
            class:is-active-node={cell.isActiveNode}
            on:click|capture={() => handleCellClick(cell)}
        >
            {#if cell.nodeId}
                {#if cell.cardViewModel}
                    <MandalaCard
                        viewModel={cell.cardViewModel}
                        uiState={cell.cardUiState}
                    />
                {/if}
            {:else if cell.isPlaceholder || cell.emptyLabel}
                <div class="row-matrix-cell__empty">
                    {cell.emptyLabel ?? ''}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .row-matrix-grid {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        display: grid;
        gap: var(--mandala-gap);
        align-items: start;
    }

    .mandala-grid--row-matrix {
        width: 100%;
        height: 100%;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-auto-rows: minmax(0, 1fr);
        align-items: stretch;
        justify-items: stretch;
    }

    .row-matrix-cell {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        cursor: default;
    }

    .row-matrix-cell.is-clickable {
        cursor: pointer;
    }

    .row-matrix-cell.mandala-cell {
        width: 100%;
        height: 100%;
    }

    .row-matrix-cell--desktop-card {
        padding: 0;
        background: transparent;
        --min-node-height: 0;
        --mandala-card-min-height: 0;
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-font-size: var(--row-matrix-font-size);
    }

    .row-matrix-cell--desktop-card :global(.mandala-card) {
        width: 100%;
        height: 100%;
        min-height: 0;
        min-width: 0;
    }

    .row-matrix-cell.is-active-cell,
    .row-matrix-cell.is-active-node {
        outline: var(--mandala-grid-highlight-width, 2px) solid
            var(--mandala-grid-highlight-color, var(--mandala-color-selection));
        outline-offset: 0;
    }

    .row-matrix-cell--desktop-card.is-active-cell,
    .row-matrix-cell--desktop-card.is-active-node {
        outline: none;
    }

    .row-matrix-cell.is-placeholder,
    .row-matrix-cell.is-empty-section {
        border: 1px dashed var(--background-modifier-border);
        border-radius: 8px;
        background: color-mix(
            in srgb,
            var(--background-primary) 80%,
            var(--background-modifier-border) 20%
        );
    }

    .row-matrix-cell__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        min-height: 0;
        padding: 10px 8px;
        text-align: center;
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.2;
        user-select: none;
    }

    :global(.mandala-white-theme) .mandala-grid--row-matrix {
        gap: 0;
        box-sizing: border-box;
    }

    :global(.mandala-white-theme) .mandala-grid--row-matrix > .mandala-cell {
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 0;
    }

    :global(.mandala-white-theme)
        .mandala-grid--row-matrix
        > .mandala-cell:nth-child(-n + 9) {
        border-top: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--row-matrix
        > .mandala-cell:nth-child(9n + 1) {
        border-left: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--row-matrix
        > .mandala-cell:nth-child(9n) {
        border-right: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme)
        .mandala-grid--row-matrix
        > .mandala-cell:nth-last-child(-n + 9) {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    :global(.mandala-white-theme) .row-matrix-cell :global(.mandala-card) {
        border: 0 !important;
        border-left-width: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
    }
</style>
