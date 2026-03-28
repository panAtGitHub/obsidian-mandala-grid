<script lang="ts">
    import Mandala3x3Layout from 'src/mandala-scenes/view-3x3/layout.svelte';
    import Mandala3x3DayPlanLayout from 'src/mandala-scenes/view-3x3-day-plan/layout.svelte';
    import Nx9Layout from 'src/mandala-scenes/view-nx9/layout.svelte';
    import Nx9WeekLayout from 'src/mandala-scenes/view-nx9-week-7x9/layout.svelte';
    import type { CardSceneProjection } from 'src/mandala-scenes/shared/scene-projection';

    export let projection: CardSceneProjection;

    const cardSceneComponents = {
        '3x3': Mandala3x3Layout,
        '3x3-day-plan': Mandala3x3DayPlanLayout,
        nx9: Nx9Layout,
        'nx9-week-7x9': Nx9WeekLayout,
    } as const;

    $: renderedComponent = cardSceneComponents[projection.props.layoutKind];
    $: renderedComponentProps =
        projection.props.layoutKind === 'nx9'
            ? {
                  ...projection.props.layoutMeta,
              }
            : projection.props.layoutKind === 'nx9-week-7x9'
              ? {
                    cells: projection.props.output.descriptors,
                    gridStyle: projection.props.layoutMeta.gridStyle,
                    themeSnapshot: projection.props.layoutMeta.themeSnapshot,
                }
              : {
                    cells: projection.props.output.descriptors,
                    ...projection.props.layoutMeta,
                };
</script>

<svelte:component this={renderedComponent} {...renderedComponentProps} />
