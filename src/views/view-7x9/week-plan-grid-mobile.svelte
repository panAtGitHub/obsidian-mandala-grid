<script lang="ts">
    import type { WeekPlanRow } from 'src/lib/mandala/day-plan';
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/views/shared/shell/context';
    import type { WeekPlanBaseCell } from 'src/lib/mandala/week-plan-context';
    import { assembleMobileWeekPlanCells } from 'src/views/view-7x9/assemble-cell-view-model';
    import { setActiveCellWeek7x9 } from 'src/helpers/views/mandala/set-active-cell-week-7x9';
    import {
        openSidebarAndEditMandalaNode,
        setActiveMandalaNode,
    } from 'src/helpers/views/mandala/node-editing';

    export let rows: WeekPlanRow[] = [];

    const view = getView();

    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const activeCell = derived(
        view.viewStore,
        (state) => state.ui.mandala.activeCellWeek7x9,
    );

    const renderText = (element: HTMLElement, content: string) => {
        const render = () => {
            element.empty();
            if (!content) return;
            element.setText(content);
        };
        render();
        return {
            update(nextContent: string) {
                content = nextContent;
                render();
            },
        };
    };

    type MobileCell = WeekPlanBaseCell & {
        title: string;
        body: string;
    };

    let cells: MobileCell[] = [];

    $: {
        cells = assembleMobileWeekPlanCells({
            rows,
            sectionIdMap: $documentState.sections.section_id,
            documentContent: $documentState.document.content,
        });
    }

    const onCellClick = (cell: MobileCell) => {
        if (!cell.nodeId) return;
        setActiveMandalaNode(view, cell.nodeId);
    };
</script>

<div class="week-plan-grid">
    {#each cells as cell (`${cell.row}-${cell.col}`)}
        <div
            class="week-plan-cell week-plan-cell--mobile"
            class:is-placeholder={cell.isPlaceholder}
            class:is-center-column={cell.isCenterColumn}
            class:is-active-cell={$activeCell &&
                $activeCell.row === cell.row &&
                $activeCell.col === cell.col}
            class:is-active-node={!$activeCell &&
                !!cell.nodeId &&
                cell.nodeId === $activeNodeId}
            on:click|capture={() =>
                setActiveCellWeek7x9(view, {
                    row: cell.row,
                    col: cell.col,
                })}
            on:click={() => onCellClick(cell)}
            on:dblclick={() =>
                cell.nodeId
                    ? openSidebarAndEditMandalaNode(view, cell.nodeId)
                    : undefined}
        >
            {#if cell.nodeId}
                <div class="week-plan-cell__content">
                    {#if cell.title}
                        <div class="week-plan-cell__title" use:renderText={cell.title}>
                        </div>
                    {/if}
                    {#if cell.body}
                        <div class="week-plan-cell__body" use:renderText={cell.body}>
                        </div>
                    {/if}
                </div>
            {:else if cell.isPlaceholder}
                <div class="week-plan-cell__empty">超出本年</div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .week-plan-grid {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-template-rows: repeat(7, minmax(0, 1fr));
        gap: 0;
        background: var(--background-secondary);
        font-size: var(--mandala-font-7x9, var(--mandala-font-9x9));
    }

    .week-plan-cell {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;
        cursor: pointer;
    }

    .week-plan-cell--mobile {
        padding: 6px;
        background: var(--background-primary);
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
    }

    .week-plan-cell--mobile.is-center-column {
        border-left: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell--mobile:nth-child(-n + 9) {
        border-top: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell--mobile:nth-child(9n) {
        border-right: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell--mobile:nth-last-child(-n + 9) {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell.is-active-cell,
    .week-plan-cell.is-active-node {
        outline: var(--mandala-grid-highlight-width, 2px) solid
            var(--mandala-grid-highlight-color, var(--mandala-color-selection));
        outline-offset: -2px;
        z-index: 1;
    }

    .week-plan-cell.is-placeholder {
        background: color-mix(
            in srgb,
            var(--background-modifier-border) 25%,
            var(--background-primary)
        );
    }

    .week-plan-cell--mobile.is-placeholder {
        cursor: default;
    }

    .week-plan-cell__content {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-height: 0;
    }

    .week-plan-cell__title {
        font-weight: 600;
        line-height: 1.2;
        color: var(--text-normal);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    .week-plan-cell__body {
        color: var(--text-muted);
        line-height: 1.2;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
        white-space: pre-wrap;
    }

    .week-plan-cell__empty {
        margin-top: auto;
        color: var(--text-faint);
        font-size: 10px;
    }
</style>
