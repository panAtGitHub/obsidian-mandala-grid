<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import type { WeekPlanRow } from 'src/lib/mandala/day-plan';
    import { getView } from 'src/views/shared/shell/context';
    import { WeekPlanCompactModeStore } from 'src/stores/settings/derived/view-settings-store';
    import { buildWeekPlanBaseCells } from 'src/lib/mandala/week-plan-context';
    import RowMatrixGridDesktop from 'src/views/view-7x9/row-matrix-grid-desktop.svelte';

    export let rows: WeekPlanRow[] = [];

    const view = getView();
    const weekPlanCompactMode = WeekPlanCompactModeStore(view);
    const documentState = derived(view.documentStore, (state) => state);

    let cells = [];

    $: cells = buildWeekPlanBaseCells({
        rows,
        sectionIdMap: $documentState.sections.section_id,
    });
</script>

<RowMatrixGridDesktop
    {cells}
    compactMode={$weekPlanCompactMode}
    fontVariable="--mandala-font-7x9"
/>
