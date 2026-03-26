<script lang="ts">
    import { Platform } from 'obsidian';
    import type { WeekPlanRow } from 'src/mandala-display/logic/day-plan';
    import type { WeekPlanMobileCellViewModel } from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';
    import WeekPlanGridDesktop from 'src/mandala-scenes/view-7x9/week-plan-grid-desktop.svelte';
    import WeekPlanGridMobile from 'src/mandala-scenes/view-7x9/week-plan-grid-mobile.svelte';

    export let rows: WeekPlanRow[] = [];
    export let mobileCells: WeekPlanMobileCellViewModel[] = [];
    export let compactMode = false;
    export let sectionColors: Record<string, string> = {};
    export let sectionColorOpacity = 0;
    export let backgroundMode = 'none';
    export let showDetailSidebar = false;
    export let whiteThemeMode = false;
</script>

<div class="week-plan-shell">
    {#if Platform.isMobile}
        <WeekPlanGridMobile {rows} cells={mobileCells} />
    {:else}
        <WeekPlanGridDesktop
            {rows}
            {compactMode}
            {sectionColors}
            {sectionColorOpacity}
            {backgroundMode}
            {showDetailSidebar}
            {whiteThemeMode}
        />
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
