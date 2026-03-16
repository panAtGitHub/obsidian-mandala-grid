<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import Button from 'src/view/components/container/shared/button.svelte';
    import {
        CalendarDays,
        ChevronLeft,
        ChevronRight,
        Grid3x3,
        Grid2x2,
        Type,
    } from 'lucide-svelte';
    import { derived } from 'src/lib/store/derived';
    import { addDaysIsoDate } from 'src/lib/mandala/day-plan';
    import {
        MandalaModeStore,
        Show9x9TitleOnlyStore,
        WeekPlanEnabledStore,
    } from 'src/stores/settings/derived/view-settings-store';

    const view = getView();
    const mode = MandalaModeStore(view);
    const show9x9TitleOnly = Show9x9TitleOnlyStore(view);
    const weekPlanEnabled = WeekPlanEnabledStore(view);
    const weekAnchorDate = derived(
        view.viewStore,
        (state) => state.ui.mandala.weekAnchorDate,
    );

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
                  ? $weekPlanEnabled
                      ? '切换到周计划'
                      : '切换到 3x3'
                  : '切换到 3x3'}
            on:click={toggleMandalaMode}
            tooltipPosition="bottom"
        >
            {#if $mode === '3x3'}
                <Grid3x3 class="svg-icon" size="18" />
            {:else if $mode === '9x9'}
                {#if $weekPlanEnabled}
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
