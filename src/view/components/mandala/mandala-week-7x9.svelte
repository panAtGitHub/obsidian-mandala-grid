<script lang="ts">
    import { Platform } from 'obsidian';
    import { derived } from 'src/lib/store/derived';
    import {
        mapWeekPlanRows,
        parseDayPlanFrontmatter,
        sectionAtCellWeek7x9,
    } from 'src/lib/mandala/day-plan';
    import { getView } from 'src/view/components/container/context';
    import {
        MandalaBackgroundModeStore,
        MandalaSectionColorOpacityStore,
        ShowMandalaDetailSidebarStore,
        WeekStartStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { setActiveCellWeek7x9 } from 'src/view/helpers/mandala/set-active-cell-week-7x9';
    import {
        openSidebarAndEditMandalaNode,
        setActiveMandalaNode,
    } from 'src/view/helpers/mandala/node-editing';
    import MandalaCard from 'src/view/components/mandala/mandala-card.svelte';
    import { SectionColorBySectionStore } from 'src/stores/document/derived/section-colors-store';
    import { applyOpacityToHex } from 'src/view/helpers/mandala/section-colors';

    const view = getView();
    const weekStart = WeekStartStore(view);
    const sectionColors = SectionColorBySectionStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const showDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);

    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const activeCell = derived(
        view.viewStore,
        (state) => state.ui.mandala.activeCellWeek7x9,
    );
    const editingState = derived(
        view.viewStore,
        (state) => state.document.editing,
    );
    const selectedNodes = derived(
        view.viewStore,
        (state) => state.document.selectedNodes,
    );
    const pinnedNodes = derived(
        view.documentStore,
        (state) => new Set(state.pinnedNodes.Ids),
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

    const onCellClick = (cell: CellModel) => {
        setActiveCellWeek7x9(view, { row: cell.row, col: cell.col });
        if (!Platform.isMobile && cell.nodeId) return;
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

    const getSectionColor = (section: string | null) => {
        if (!section || $backgroundMode !== 'custom') return null;
        const color = $sectionColors[section];
        if (!color) return null;
        return applyOpacityToHex(color, $sectionColorOpacity / 100);
    };
</script>

<div class="week-plan-shell">
    <div class="week-plan-grid">
        {#each cells as cell (`${cell.row}-${cell.col}`)}
            <div
                class="week-plan-cell"
                class:week-plan-cell--desktop-card={!Platform.isMobile}
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
                on:dblclick={() => onCellDblClick(cell)}
            >
                {#if !Platform.isMobile && cell.nodeId}
                    <MandalaCard
                        nodeId={cell.nodeId}
                        section={sectionAtCellWeek7x9(cell.row, cell.col, rows) ?? ''}
                        active={cell.nodeId === $activeNodeId}
                        preserveActiveBackground={$whiteThemeMode}
                        sectionIndicatorVariant={!$whiteThemeMode
                            ? 'section-capsule'
                            : 'plain-with-pin'}
                        editing={$editingState.activeNodeId === cell.nodeId &&
                            !$editingState.isInSidebar &&
                            !$showDetailSidebar}
                        selected={$selectedNodes.has(cell.nodeId)}
                        pinned={$pinnedNodes.has(cell.nodeId)}
                        sectionColor={getSectionColor(
                            sectionAtCellWeek7x9(cell.row, cell.col, rows),
                        )}
                        draggable={false}
                        gridCell={{ mode: 'week-7x9', row: cell.row, col: cell.col }}
                    />
                {:else if cell.nodeId}
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
        width: 100%;
        height: 100%;
    }

    .week-plan-grid {
        flex: 1 1 auto;
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
        min-height: 0;
        padding: 6px;
        background: var(--background-primary);
        border-left: 1px dashed var(--mandala-border-color);
        border-top: 1px dashed var(--mandala-border-color);
        overflow: hidden;
        cursor: pointer;
    }

    .week-plan-cell--desktop-card {
        padding: 0;
        background: var(--background-secondary);

        --min-node-height: 0;
        --mandala-card-min-height: 0;
        --mandala-card-width: 100%;
        --mandala-card-height: 100%;
        --mandala-card-overflow: hidden;
        --font-text-size: var(--mandala-font-9x9, 11px);
    }

    .week-plan-cell--desktop-card :global(.mandala-card) {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        font-size: var(--mandala-font-9x9, 11px);
    }

    .week-plan-cell--desktop-card :global(.lng-prev) {
        min-height: 0;
        padding: 6px 6px 8px 8px;
    }

    .week-plan-cell--desktop-card :global(.mandala-card-meta) {
        top: 4px;
        right: 6px;
        font-size: 10px;
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
