<script lang="ts">
    import RowMatrixGridDesktop from 'src/mandala-scenes/view-7x9/row-matrix-grid-desktop.svelte';
    import type { WeekPlanDesktopCellViewModel } from 'src/mandala-scenes/view-7x9/assemble-cell-view-model';

    export let cells: WeekPlanDesktopCellViewModel[] = [];
    export let compactMode = false;
</script>

<RowMatrixGridDesktop
    {cells}
    {compactMode}
    fontVariable="--mandala-font-7x9"
/>
