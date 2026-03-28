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
</script>

<svelte:component this={renderedComponent} {...projection.props} />
