<script lang="ts">
    import { Platform } from 'obsidian';
    import type { WeekPlanRow } from 'src/lib/mandala/day-plan';
    import WeekPlanGridDesktop from 'src/views/view-7x9/week-plan-grid-desktop.svelte';
    import WeekPlanGridMobile from 'src/views/view-7x9/week-plan-grid-mobile.svelte';

    export let rows: WeekPlanRow[] = [];
</script>

<div class="week-plan-shell">
    {#if Platform.isMobile}
        <WeekPlanGridMobile {rows} />
    {:else}
        <WeekPlanGridDesktop {rows} />
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
