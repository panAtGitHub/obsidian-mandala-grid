<script lang="ts">
    import { derived } from 'src/lib/store/derived';
    import { getView } from 'src/views/shared/shell/context';
    import { WeekStartStore } from 'src/stores/settings/derived/view-settings-store';
    import { resolveWeekPlanContext } from 'src/lib/mandala/week-plan-context';
    import WeekPlanLayout from 'src/views/view-7x9/layout.svelte';

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

<WeekPlanLayout rows={weekContext.rows} />
