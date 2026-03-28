<script lang="ts">
    import Mandala3x3Layout from 'src/mandala-scenes/view-3x3/layout.svelte';
    import Nx9Layout from 'src/mandala-scenes/view-nx9/layout.svelte';
    import WeekPlanLayout from 'src/mandala-scenes/view-7x9/layout.svelte';
    import type { CardSceneProjection } from 'src/mandala-scenes/shared/scene-projection';

    export let projection: CardSceneProjection;

    const cardSceneComponents = {
        '3x3': Mandala3x3Layout,
        nx9: Nx9Layout,
        week: WeekPlanLayout,
    } as const;

    $: renderedComponent = cardSceneComponents[projection.props.layoutKind];
    $: renderedComponentProps =
        projection.props.layoutKind === '3x3'
            ? {
                  cells: projection.props.output.descriptors,
                  ...projection.props.layoutMeta,
              }
            : projection.props.layoutKind === 'week'
              ? {
                    rows: projection.props.layoutMeta.rows,
                    desktopCells: projection.props.output.desktopDescriptors,
                    mobileCells: projection.props.output.mobileDescriptors,
                    compactMode: projection.props.layoutMeta.compactMode,
                }
              : {
                    ...projection.props.layoutMeta,
                };
</script>

<svelte:component this={renderedComponent} {...renderedComponentProps} />
