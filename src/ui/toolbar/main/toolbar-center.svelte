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
    import { getWeekIndexInPlanYear } from 'src/mandala-display/logic/day-plan';
    import {
        resolveMandalaSceneKey,
        type MandalaSceneKey,
    } from 'src/mandala-display/logic/mandala-profile';
    import {
        MandalaModeStore,
        WeekPlanEnabledStore,
        Nx9RowsPerPageStore,
        Show9x9TitleOnlyStore,
        WeekStartStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import Button from 'src/shared/ui/button.svelte';
    import { resolveNx9Context } from 'src/mandala-scenes/view-nx9/context';
    import {
        getMandalaActiveCellNx9,
        getMandalaWeekAnchorDate,
    } from 'src/mandala-scenes/shared/scene-runtime';
    import {
        navigateMandalaWeek,
        setMandalaWeekAnchorDate,
    } from 'src/view/helpers/navigate-mandala-week';

    const view = getView();
    const mode = MandalaModeStore(view);
    const weekPlanEnabled = WeekPlanEnabledStore(view);
    const nx9RowsPerPage = Nx9RowsPerPageStore(view);
    const show9x9TitleOnly = Show9x9TitleOnlyStore(view);
    const weekStart = WeekStartStore(view);
    const documentState = derived(view.documentStore, (state) => state);
    const activeNodeId = derived(
        view.viewStore,
        (state) => state.document.activeNode,
    );
    const weekAnchorDate = derived(view.viewStore, (state) =>
        getMandalaWeekAnchorDate(state),
    );
    const activeCellNx9 = derived(view.viewStore, (state) =>
        getMandalaActiveCellNx9(state),
    );
    let sceneKey: MandalaSceneKey = {
        viewKind: '3x3',
        variant: 'default',
    };

    $: canUseNx9Mode = view.canUseNx9Mode($documentState.file.frontmatter);
    $: sceneKey = resolveMandalaSceneKey({
        frontmatter: $documentState.file.frontmatter,
        viewKind: $mode,
        weekPlanEnabled: $weekPlanEnabled,
    });
    $: activeSection =
        $documentState.sections.id_section[$activeNodeId] ?? null;
    $: nx9Context =
        $mode === 'nx9'
            ? resolveNx9Context({
                  sectionIdMap: $documentState.sections.section_id,
                  documentContent: $documentState.document.content,
                  rowsPerPage: $nx9RowsPerPage,
                  activeSection,
                  activeCell: $activeCellNx9,
                  coreSectionMax:
                      view.getEffectiveMandalaSettings().view.coreSectionMax,
              })
            : null;
    $: currentWeekLabel =
        $weekAnchorDate && sceneKey.variant === 'week-7x9'
            ? `第${getWeekIndexInPlanYear($weekAnchorDate, $weekStart)}周`
            : '本周';

    const toggleMandalaMode = () => {
        view.cycleMandalaMode();
    };

    const toggle9x9TitleOnly = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-9x9-title-only',
        });
    };

    const goToPreviousWeek = () => {
        navigateMandalaWeek(view, 'prev');
    };

    const goToNextWeek = () => {
        navigateMandalaWeek(view, 'next');
    };

    const goToThisWeek = () => {
        setMandalaWeekAnchorDate(view, new Date().toISOString().slice(0, 10));
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
                  ? canUseNx9Mode
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
                <Grid2x2 class="svg-icon" size="18" />
            {:else}
                <Grid2x2 class="svg-icon" size="18" />
            {/if}
        </Button>
        {#if $mode === 'nx9' && sceneKey.variant === 'week-7x9'}
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
                    classes="topbar-button toolbar-center__week-button"
                    label={currentWeekLabel}
                    on:click={goToThisWeek}
                    tooltipPosition="bottom"
                >
                    <CalendarDays class="svg-icon" size="18" />
                    <span class="toolbar-center__week-label">
                        {currentWeekLabel}
                    </span>
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
                    disabled={!nx9Context || nx9Context.currentPage <= 0}
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
                    disabled={!nx9Context ||
                        nx9Context.currentPage >= nx9Context.totalPages - 1}
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

    :global(.toolbar-center__week-button) {
        width: auto !important;
        min-width: 34px;
        gap: 6px;
        padding-inline: 10px;
        line-height: 1;
    }

    .toolbar-center__week-label {
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
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
