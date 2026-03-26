<script lang="ts">
    import { afterUpdate, tick, onDestroy } from 'svelte';
    import Mandala3x3Layout from 'src/mandala-scenes/view-3x3/layout.svelte';
    import NineByNineLayout from 'src/mandala-scenes/view-9x9/layout.svelte';
    import Nx9Layout from 'src/mandala-scenes/view-nx9/layout.svelte';
    import WeekPlanLayout from 'src/mandala-scenes/view-7x9/layout.svelte';
    import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
    import {
        sceneKeyEquals,
        type SceneProjection,
        type ThreeByThreeSceneProjectionProps,
    } from 'src/mandala-scenes/shared/scene-projection';

    export let sceneKey: MandalaSceneKey = {
        viewKind: '3x3',
        variant: 'default',
    };
    export let projection: SceneProjection;
    export let committedSceneKey: MandalaSceneKey = sceneKey;

    let renderedProjection = projection;
    let pendingProjection = projection;
    let isSwitchingScene = false;
    let isDestroyed = false;
    let renderedThreeByThreeProps: ThreeByThreeSceneProjectionProps | null =
        projection?.rendererKind === '3x3-layout' ? projection.props : null;

    const waitForNextPaint = () =>
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });

    const commitProjection = async () => {
        if (isDestroyed) return;
        const nextProjection = pendingProjection;
        if (
            sceneKeyEquals(renderedProjection.sceneKey, nextProjection.sceneKey)
        ) {
            renderedProjection = nextProjection;
            committedSceneKey = nextProjection.sceneKey;
            renderedThreeByThreeProps =
                nextProjection.rendererKind === '3x3-layout'
                    ? nextProjection.props
                    : null;
            return;
        }
        if (isSwitchingScene) return;
        isSwitchingScene = true;
        await tick();
        await waitForNextPaint();
        if (isDestroyed) {
            return;
        }
        renderedProjection = pendingProjection;
        committedSceneKey = renderedProjection.sceneKey;
        renderedThreeByThreeProps =
            renderedProjection.rendererKind === '3x3-layout'
                ? renderedProjection.props
                : null;
        isSwitchingScene = false;
        if (
            !sceneKeyEquals(renderedProjection.sceneKey, pendingProjection.sceneKey)
        ) {
            void commitProjection();
        }
    };

    onDestroy(() => {
        isDestroyed = true;
    });

    afterUpdate(() => {
        pendingProjection = projection;
        void commitProjection();
    });
</script>

{#key `${renderedProjection.sceneKey.viewKind}:${renderedProjection.sceneKey.variant}`}
    {#if renderedProjection.rendererKind === '3x3-layout' && renderedThreeByThreeProps}
        <Mandala3x3Layout
            cells={renderedThreeByThreeProps.cells}
            theme={renderedThreeByThreeProps.theme}
            animateSwap={renderedThreeByThreeProps.animateSwap}
            show3x3SubgridNavButtons={renderedThreeByThreeProps.show3x3SubgridNavButtons}
            hasOpenOverlayModal={renderedThreeByThreeProps.hasOpenOverlayModal}
            dayPlanEnabled={renderedThreeByThreeProps.dayPlanEnabled}
            showDayPlanTodayButton={renderedThreeByThreeProps.showDayPlanTodayButton}
            dayPlanTodayTargetSection={renderedThreeByThreeProps.dayPlanTodayTargetSection}
            activeCoreSection={renderedThreeByThreeProps.activeCoreSection}
            todayButtonLabel={renderedThreeByThreeProps.todayButtonLabel}
            enterSubgridFromButton={renderedThreeByThreeProps.enterSubgridFromButton}
            exitSubgridFromButton={renderedThreeByThreeProps.exitSubgridFromButton}
            focusDayPlanTodayFromButton={renderedThreeByThreeProps.focusDayPlanTodayFromButton}
            onMobileCardDoubleClick={renderedThreeByThreeProps.onMobileCardDoubleClick}
            getUpButtonLabel={renderedThreeByThreeProps.getUpButtonLabel}
            getDownButtonLabel={renderedThreeByThreeProps.getDownButtonLabel}
        />
    {:else if renderedProjection.rendererKind === '9x9-layout'}
        <NineByNineLayout />
    {:else if renderedProjection.rendererKind === 'week-layout'}
        <WeekPlanLayout />
    {:else}
        <Nx9Layout />
    {/if}
{/key}
