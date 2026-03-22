<script lang="ts">
    import { Platform } from 'obsidian';
    import {
        clickSimpleSummaryCell,
        doubleClickSimpleSummaryCell,
        pointerStartSimpleSummaryCell,
    } from 'src/mandala-cell/viewmodel/controller/simple-summary-cell-controller';
    import {
        isSwapDisabledNode,
        isSwapSourceNode,
        isSwapTargetNode,
    } from 'src/mandala-cell/viewmodel/controller/swap-controller';
    import type {
        SimpleSummaryActiveCell,
        SimpleSummaryCellModel,
    } from 'src/mandala-cell/model/simple-summary-cell-model';
    import type { MandalaSwapInteractionState } from 'src/mandala-interaction/helpers/mandala-swap';
    import { getView } from 'src/mandala-scenes/shared/shell/context';

    export let cell: SimpleSummaryCellModel;
    export let activeNodeId: string | null;
    export let activeCell: SimpleSummaryActiveCell;
    export let showTitleOnly = false;
    export let swapState: MandalaSwapInteractionState;

    const view = getView();

    const renderCellMarkdown = (element: HTMLElement, content: string) => {
        const render = () => {
            element.empty();
            if (!content) {
                return;
            }
            // 81格预览使用纯文本摘要，避免Markdown块级DOM在极小网格中造成布局错乱。
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
</script>

<div
    class="simple-cell"
    class:is-center={cell.isCenter}
    class:is-theme-center={cell.isThemeCenter}
    class:is-title-only={showTitleOnly}
    class:is-active={cell.nodeId && cell.nodeId === activeNodeId && !activeCell}
    class:is-active-cell={activeCell &&
        cell.row === activeCell.row &&
        cell.col === activeCell.col}
    class:is-block-row-start={cell.row % 3 === 0}
    class:is-block-col-start={cell.col % 3 === 0}
    class:is-last-row={cell.row === 8}
    class:is-last-col={cell.col === 8}
    class:has-custom-background={Boolean(cell.background)}
    class:simple-cell--swap-source={!!cell.nodeId &&
        isSwapSourceNode(swapState, cell.nodeId)}
    class:simple-cell--swap-target={!!cell.nodeId &&
        isSwapTargetNode(swapState, cell.nodeId)}
    class:simple-cell--swap-disabled={!!cell.nodeId &&
        isSwapDisabledNode(swapState, cell.nodeId)}
    style={cell.style ?? undefined}
    data-node-id={cell.nodeId || undefined}
    id={cell.nodeId || undefined}
    on:mousedown={(event) =>
        pointerStartSimpleSummaryCell({
            view,
            swapState,
            cell,
            event,
        })}
    on:touchstart={(event) =>
        pointerStartSimpleSummaryCell({
            view,
            swapState,
            cell,
            event,
        })}
    on:click={() =>
        clickSimpleSummaryCell({
            view,
            swapActive: swapState.active,
            cell,
        })}
    on:dblclick={() =>
        doubleClickSimpleSummaryCell({
            view,
            swapActive: swapState.active,
            isMobile: Platform.isMobile,
            cell,
        })}
>
    <div class="cell-content">
        {#if cell.titleMarkdown}
            <div class="cell-title" use:renderCellMarkdown={cell.titleMarkdown}>
            </div>
        {/if}
        {#if !showTitleOnly && cell.bodyMarkdown}
            <div class="cell-body" use:renderCellMarkdown={cell.bodyMarkdown}>
            </div>
        {/if}
    </div>
    {#if cell.section}
        <span class="cell-debug">{cell.section}</span>
    {/if}
</div>

<style>
    .simple-cell {
        background-color: var(--background-primary);
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        border-radius: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 6px;
        position: relative;
        user-select: none;
        box-sizing: border-box;
    }

    .simple-cell.is-block-row-start {
        border-top: 3px solid var(--mandala-border-color);
    }

    .simple-cell.is-block-col-start {
        border-left: 3px solid var(--mandala-border-color);
    }

    .simple-cell.is-last-row {
        border-bottom: 3px solid var(--mandala-border-color);
    }

    .simple-cell.is-last-col {
        border-right: 3px solid var(--mandala-border-color);
    }

    .cell-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        height: 100%;
    }

    .cell-title {
        font-size: var(--mandala-h1-size, 1em);
        font-weight: 600;
        line-height: 1.2;
        color: var(--text-normal);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        flex-shrink: 0;
    }

    .cell-body {
        font-size: 0.9em;
        color: var(--text-muted);
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: var(--mandala-body-lines, 3);
        -webkit-box-orient: vertical;
        white-space: pre-wrap;
        word-break: break-all;
    }

    .is-center {
        background-color: var(--background-secondary-alt);
        border-color: var(--text-muted);
    }

    .is-theme-center {
        background-color: var(--background-primary-alt);
    }

    .is-theme-center:not(.has-custom-background) .cell-title {
        font-weight: 700;
        color: var(--text-accent);
    }

    .simple-cell.is-active,
    .simple-cell.is-active-cell {
        position: relative;
    }

    .simple-cell.is-active::after,
    .simple-cell.is-active-cell::after {
        content: '';
        position: absolute;
        inset: 2px;
        border: 2px solid var(--mandala-selection-color);
        pointer-events: none;
        box-sizing: border-box;
        border-radius: 0;
    }

    .simple-cell--swap-source,
    .simple-cell--swap-target {
        box-shadow: inset 0 0 0 2px var(--interactive-accent);
    }

    .simple-cell--swap-target {
        cursor: pointer;
    }

    .simple-cell--swap-disabled {
        opacity: 0.6;
    }

    .cell-debug {
        position: absolute;
        bottom: 1px;
        right: 1px;
        font-size: 8px;
        color: var(--text-faint);
        opacity: 0.5;
        pointer-events: none;
    }

    .simple-cell.is-title-only .cell-content {
        justify-content: center;
        align-items: center;
        height: 100%;
    }

    .simple-cell.is-title-only .cell-title {
        display: block;
        -webkit-line-clamp: unset;
        -webkit-box-orient: unset;
        text-align: center;
        white-space: normal;
        word-break: break-word;
    }
</style>
