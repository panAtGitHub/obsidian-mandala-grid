<script lang="ts">
    import { Platform } from 'obsidian';
    import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-svelte';
    import { derived } from 'src/lib/store/derived';
    import {
        addDaysIsoDate,
        getChineseFullWeekdayLabel,
        mapWeekPlanRows,
        parseDayPlanFrontmatter,
        sectionAtCellWeek7x9,
    } from 'src/lib/mandala/day-plan';
    import { getView } from 'src/view/components/container/context';
    import { WeekStartStore } from 'src/stores/settings/derived/view-settings-store';
    import { setActiveCellWeek7x9 } from 'src/view/helpers/mandala/set-active-cell-week-7x9';
    import {
        openSidebarAndEditMandalaNode,
        setActiveMandalaNode,
    } from 'src/view/helpers/mandala/node-editing';

    const view = getView();
    const weekStart = WeekStartStore(view);

    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const activeCell = derived(
        view.viewStore,
        (state) => state.ui.mandala.activeCellWeek7x9,
    );
    const anchorDate = derived(
        view.viewStore,
        (state) => state.ui.mandala.weekAnchorDate,
    );

    type CellSummary = { title: string; body: string };
    const summaryCache = new Map<string, CellSummary>();

    const normalizeCellPreviewText = (raw: string) =>
        raw
            .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, '')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
            .replace(/\[\[([^\]]+)\]\]/g, '$1')
            .replace(/\s+/g, ' ')
            .trim();

    const HEADING_RE = /^\s{0,3}#{1,6}\s+/;
    const buildSummary = (nodeId: string, content: string): CellSummary => {
        const cacheKey = `${nodeId}::${content}`;
        const cached = summaryCache.get(cacheKey);
        if (cached) return cached;

        const lines = content.split('\n');
        const firstLine = lines[0]?.trim() ?? '';
        let title = '';
        let body = '';

        if (firstLine && HEADING_RE.test(firstLine)) {
            title = normalizeCellPreviewText(firstLine.replace(HEADING_RE, ''));
            body = normalizeCellPreviewText(lines.slice(1).join('\n')).slice(0, 150);
        } else {
            body = normalizeCellPreviewText(lines.join('\n')).slice(0, 150);
        }

        const summary = { title, body };
        summaryCache.set(cacheKey, summary);
        return summary;
    };

    type CellModel = {
        row: number;
        col: number;
        date: string;
        section: string | null;
        coreSection: string | null;
        nodeId: string | null;
        title: string;
        body: string;
        isPlaceholder: boolean;
        isCenterColumn: boolean;
    };

    let rows: ReturnType<typeof mapWeekPlanRows> = [];
    let cells: CellModel[] = [];

    $: {
        const plan = parseDayPlanFrontmatter($documentState.file.frontmatter);
        rows =
            plan && $anchorDate
                ? mapWeekPlanRows(plan.year, $anchorDate, $weekStart)
                : [];
    }

    $: {
        const nextCells: CellModel[] = [];
        for (let row = 0; row < 7; row += 1) {
            const rowModel = rows[row] ?? {
                date: '',
                coreSection: null,
                inPlanYear: false,
            };
            for (let col = 0; col < 9; col += 1) {
                const section = sectionAtCellWeek7x9(row, col, rows);
                const nodeId = section
                    ? $documentState.sections.section_id[section] ?? null
                    : null;
                const content = nodeId
                    ? $documentState.document.content[nodeId]?.content ?? ''
                    : '';
                const summary = nodeId
                    ? buildSummary(nodeId, content)
                    : { title: '', body: '' };
                nextCells.push({
                    row,
                    col,
                    date: rowModel.date,
                    section,
                    coreSection: rowModel.coreSection,
                    nodeId,
                    title: summary.title,
                    body: summary.body,
                    isPlaceholder: !rowModel.inPlanYear,
                    isCenterColumn: col === 0,
                });
            }
        }
        cells = nextCells;
    }

    const setWeekAnchorDate = (date: string) => {
        view.viewStore.dispatch({
            type: 'view/mandala/week-anchor-date/set',
            payload: { date },
        });
        setActiveCellWeek7x9(view, null);
    };

    const goToPreviousWeek = () => {
        if (!$anchorDate) return;
        setWeekAnchorDate(addDaysIsoDate($anchorDate, -7));
    };

    const goToNextWeek = () => {
        if (!$anchorDate) return;
        setWeekAnchorDate(addDaysIsoDate($anchorDate, 7));
    };

    const goToThisWeek = () => {
        setWeekAnchorDate(new Date().toISOString().slice(0, 10));
    };

    const onCellClick = (cell: CellModel) => {
        setActiveCellWeek7x9(view, { row: cell.row, col: cell.col });
        if (!cell.nodeId) return;
        setActiveMandalaNode(view, cell.nodeId);
    };

    const onCellDblClick = (cell: CellModel) => {
        if (!cell.nodeId || Platform.isMobile) return;
        openSidebarAndEditMandalaNode(view, cell.nodeId);
    };

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
</script>

<div class="week-plan-shell">
    <div class="week-plan-toolbar">
        <button
            class="week-plan-toolbar__button"
            type="button"
            aria-label="上一周"
            on:click={goToPreviousWeek}
        >
            <ChevronLeft size={16} />
        </button>
        <button
            class="week-plan-toolbar__button week-plan-toolbar__button--today"
            type="button"
            aria-label="本周"
            on:click={goToThisWeek}
        >
            <CalendarDays size={16} />
            <span>本周</span>
        </button>
        <button
            class="week-plan-toolbar__button"
            type="button"
            aria-label="下一周"
            on:click={goToNextWeek}
        >
            <ChevronRight size={16} />
        </button>
    </div>

    <div class="week-plan-grid">
        {#each cells as cell (`${cell.row}-${cell.col}`)}
            <div
                class="week-plan-cell"
                class:is-placeholder={cell.isPlaceholder}
                class:is-center-column={cell.isCenterColumn}
                class:is-active-cell={$activeCell &&
                    $activeCell.row === cell.row &&
                    $activeCell.col === cell.col}
                class:is-active-node={!$activeCell &&
                    !!cell.nodeId &&
                    cell.nodeId === $activeNodeId}
                on:click={() => onCellClick(cell)}
                on:dblclick={() => onCellDblClick(cell)}
            >
                <div class="week-plan-cell__meta">
                    <span class="week-plan-cell__date">
                        {cell.date ? cell.date.slice(5) : '--'}
                    </span>
                    <span class="week-plan-cell__weekday">
                        {cell.date ? getChineseFullWeekdayLabel(cell.date) : ''}
                    </span>
                </div>

                {#if cell.section}
                    <span class="week-plan-cell__section">{cell.section}</span>
                {/if}

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
</div>

<style>
    .week-plan-shell {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        height: 100%;
    }

    .week-plan-toolbar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .week-plan-toolbar__button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        border-radius: 8px;
        padding: 6px 10px;
    }

    .week-plan-grid {
        display: grid;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        grid-template-rows: repeat(7, minmax(0, 1fr));
        width: 100%;
        height: 100%;
        gap: 0;
        background: var(--background-secondary);
        font-size: var(--mandala-font-9x9, 11px);
    }

    .week-plan-cell {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
        padding: 6px;
        background: var(--background-primary);
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        overflow: hidden;
        cursor: pointer;
    }

    .week-plan-cell.is-center-column {
        border-left: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell:nth-child(-n + 9) {
        border-top: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell:nth-child(9n) {
        border-right: 3px solid var(--mandala-border-color);
    }

    .week-plan-cell:nth-last-child(-n + 9) {
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
        cursor: default;
    }

    .week-plan-cell__meta {
        display: flex;
        gap: 6px;
        font-size: 10px;
        color: var(--text-faint);
        line-height: 1.1;
    }

    .week-plan-cell__section {
        position: absolute;
        top: 6px;
        right: 8px;
        font-size: 10px;
        color: var(--text-faint);
    }

    .week-plan-cell__content {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-height: 0;
        margin-top: 14px;
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

    :global(.is-mobile) .week-plan-toolbar {
        justify-content: stretch;
    }

    :global(.is-mobile) .week-plan-toolbar__button {
        flex: 1 1 0;
        justify-content: center;
    }
</style>
