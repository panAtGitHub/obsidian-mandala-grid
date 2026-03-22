<script lang="ts">
    import {
        CalendarDays,
        ChevronLeft,
        ChevronRight,
        Grid2x2,
        Grid3x3,
        Type,
    } from 'lucide-svelte';
    import { derived } from 'src/shared/store/derived';
    import { openNx9RowsPerPageModal } from 'src/obsidian/modals/nx9-rows-per-page-modal';
    import { addDaysIsoDate } from 'src/mandala-display/logic/day-plan';
    import {
        MandalaModeStore,
        Nx9RowsPerPageStore,
        Show9x9TitleOnlyStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import Button from 'src/shared/ui/button.svelte';
    import { resolveNx9Context } from 'src/mandala-scenes/view-nx9/context';

    const view = getView();
    const mode = MandalaModeStore(view);
    const nx9RowsPerPage = Nx9RowsPerPageStore(view);
    const show9x9TitleOnly = Show9x9TitleOnlyStore(view);
    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const weekAnchorDate = derived(
        view.viewStore,
        (state) => state.ui.mandala.weekAnchorDate,
    );
    const mandalaUiState = derived(view.viewStore, (state) => state.ui.mandala);

    $: canUseWeekPlanMode = view.canUseWeekPlanMode(
        $documentState.file.frontmatter,
    );
    $: canUseNx9Mode = view.canUseNx9Mode($documentState.file.frontmatter);
    $: activeSection =
        $documentState.sections.id_section[$activeNodeId] ?? null;
    $: nx9Context = resolveNx9Context({
        sectionIdMap: $documentState.sections.section_id,
        documentContent: $documentState.document.content,
        rowsPerPage: $nx9RowsPerPage,
        activeSection,
        activeCell: $mandalaUiState.activeCellNx9,
    });

    const toggleMandalaMode = () => {
        view.cycleMandalaMode();
    };

    const toggle9x9TitleOnly = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-9x9-title-only',
        });
    };

    const setWeekAnchorDate = (date: string) => {
        view.viewStore.dispatch({
            type: 'view/mandala/week-anchor-date/set',
            payload: { date },
        });
        view.viewStore.dispatch({
            type: 'view/mandala/week-active-cell/set',
            payload: { cell: null },
        });
    };

    const goToPreviousWeek = () => {
        if (!$weekAnchorDate) return;
        setWeekAnchorDate(addDaysIsoDate($weekAnchorDate, -7));
    };

    const goToNextWeek = () => {
        if (!$weekAnchorDate) return;
        setWeekAnchorDate(addDaysIsoDate($weekAnchorDate, 7));
    };

    const goToThisWeek = () => {
        setWeekAnchorDate(new Date().toISOString().slice(0, 10));
    };

    const goToPreviousNx9Page = () => {
        view.focusNx9Page('prev');
    };

    const goToNextNx9Page = () => {
        view.focusNx9Page('next');
    };

    const changeNx9RowsPerPage = async () => {
        const value = await openNx9RowsPerPageModal(
            view.plugin,
            $nx9RowsPerPage,
        );
        if (value === null || value === $nx9RowsPerPage) return;
        view.setCurrentNx9RowsPerPage(value);
    };
</script>

<div class="toolbar-center">
    <div class="lock-toggle-container topbar-buttons-group">
        {#if $mode === '9x9'}
            <Button
                active={$show9x9TitleOnly}
                classes="topbar-button"
                label="仅显示标题"
                on:click={toggle9x9TitleOnly}
                tooltipPosition="bottom"
            >
                <Type class="svg-icon" size="18" />
            </Button>
        {/if}
        <Button
            active={$mode !== '3x3'}
            classes="topbar-button"
            label={$mode === '3x3'
                ? '切换到 9x9'
                : $mode === '9x9'
                  ? canUseWeekPlanMode
                      ? '切换到周计划'
                      : canUseNx9Mode
                        ? '切换到 Nx9'
                        : '切换到 3x3'
                  : $mode === 'nx9'
                    ? '切换到 3x3'
                    : '切换到 3x3'}
            on:click={toggleMandalaMode}
            tooltipPosition="bottom"
        >
            {#if $mode === '3x3'}
                <Grid3x3 class="svg-icon" size="18" />
            {:else if $mode === '9x9'}
                {#if canUseWeekPlanMode}
                    <CalendarDays class="svg-icon" size="18" />
                {:else}
                    <Grid2x2 class="svg-icon" size="18" />
                {/if}
            {:else}
                <Grid2x2 class="svg-icon" size="18" />
            {/if}
        </Button>
        {#if $mode === 'week-7x9'}
            <div class="week-nav-group">
                <Button
                    classes="topbar-button"
                    label="上一周"
                    on:click={goToPreviousWeek}
                    tooltipPosition="bottom"
                >
                    <ChevronLeft class="svg-icon" size="18" />
                </Button>
                <Button
                    classes="topbar-button"
                    label="本周"
                    on:click={goToThisWeek}
                    tooltipPosition="bottom"
                >
                    <CalendarDays class="svg-icon" size="18" />
                </Button>
                <Button
                    classes="topbar-button"
                    label="下一周"
                    on:click={goToNextWeek}
                    tooltipPosition="bottom"
                >
                    <ChevronRight class="svg-icon" size="18" />
                </Button>
            </div>
        {:else if $mode === 'nx9'}
            <div class="week-nav-group">
                <Button
                    classes="topbar-button"
                    label="上一页"
                    disabled={nx9Context.currentPage <= 0}
                    on:click={goToPreviousNx9Page}
                    tooltipPosition="bottom"
                >
                    <ChevronLeft class="svg-icon" size="18" />
                </Button>
                <Button
                    classes="topbar-button toolbar-center__text"
                    label="设置 Nx9 每页行数"
                    on:click={changeNx9RowsPerPage}
                    tooltipPosition="bottom"
                >
                    n={$nx9RowsPerPage}
                </Button>
                <Button
                    classes="topbar-button"
                    label="下一页"
                    disabled={nx9Context.currentPage >=
                        nx9Context.totalPages - 1}
                    on:click={goToNextNx9Page}
                    tooltipPosition="bottom"
                >
                    <ChevronRight class="svg-icon" size="18" />
                </Button>
            </div>
        {/if}
    </div>
</div>

<style>
    .toolbar-center {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
    }

    .lock-toggle-container {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .week-nav-group {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 4px;
    }

    :global(.toolbar-center__text) {
        min-width: 56px;
        font-size: 12px;
    }

    :global(.is-mobile) .lock-toggle-container {
        transform: none;
        z-index: 1002;
        background: transparent;
        padding: 0;
        border: none;
        box-shadow: none;
        border-radius: 0;
        gap: 6px;
    }

    :global(.is-mobile) .week-nav-group {
        margin-left: 0;
    }
</style>
