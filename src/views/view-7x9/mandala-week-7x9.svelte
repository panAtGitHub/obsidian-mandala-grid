<script lang="ts">
    import { Platform } from 'obsidian';
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/views/shared/shell/context';
    import { WeekStartStore } from 'src/stores/settings/derived/view-settings-store';
    import { resolveWeekPlanContext } from 'src/view/helpers/mandala/week-plan-context';
    import WeekPlanGridDesktop from 'src/views/view-7x9/week-plan-grid-desktop.svelte';
    import WeekPlanGridMobile from 'src/views/view-7x9/week-plan-grid-mobile.svelte';

    const view = getView();
    const weekStart = WeekStartStore(view);
    const documentState = derived(view.documentStore, (state) => state);
    const anchorDate = derived(
        view.viewStore,
        (state) => state.ui.mandala.weekAnchorDate,
    );

    let weekContext = resolveWeekPlanContext({
        frontmatter: '',
        anchorDate: null,
        weekStart: 'monday',
    });

    $: weekContext = resolveWeekPlanContext({
        frontmatter: $documentState.file.frontmatter,
        anchorDate: $anchorDate,
        weekStart: $weekStart,
    });
</script>

<div class="week-plan-shell">
    {#if Platform.isMobile}
        <WeekPlanGridMobile rows={weekContext.rows} />
    {:else}
        <WeekPlanGridDesktop rows={weekContext.rows} />
    {/if}
</div>

<style>
    .week-plan-shell {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }
</style>
