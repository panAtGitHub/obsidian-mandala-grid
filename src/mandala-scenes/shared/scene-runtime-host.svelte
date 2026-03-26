<script lang="ts">
    import { afterUpdate, tick, onDestroy } from 'svelte';
    import Mandala3x3Layout from 'src/mandala-scenes/view-3x3/layout.svelte';
    import NineByNineLayout from 'src/mandala-scenes/view-9x9/layout.svelte';
    import Nx9Layout from 'src/mandala-scenes/view-nx9/layout.svelte';
    import WeekPlanLayout from 'src/mandala-scenes/view-7x9/layout.svelte';
    import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
    import {
        type SceneProjection,
    } from 'src/mandala-scenes/shared/scene-projection';
    import {
        createSceneCommitSnapshot,
        hasPendingSceneSwitch,
    } from 'src/mandala-scenes/shared/scene-switch';

    export let sceneKey: MandalaSceneKey = {
        viewKind: '3x3',
        variant: 'default',
    };
    export let projection: SceneProjection;
    export let committedSceneKey: MandalaSceneKey = sceneKey;
    export let onCommittedSceneChange:
        | ((sceneKey: MandalaSceneKey) => void)
        | null = null;

    let renderedProjection = projection;
    let pendingProjection = projection;
    let isSwitchingScene = false;
    let isDestroyed = false;
    const rendererComponentByKind = {
        '3x3-layout': Mandala3x3Layout,
        '9x9-layout': NineByNineLayout,
        'nx9-layout': Nx9Layout,
        'week-layout': WeekPlanLayout,
    } as const;
    let {
        committedSceneKey: initialCommittedSceneKey,
        renderedThreeByThreeProps,
    } = createSceneCommitSnapshot(projection);
    committedSceneKey = initialCommittedSceneKey;
    $: renderedComponent =
        rendererComponentByKind[renderedProjection.rendererKind];
    $: renderedComponentProps =
        renderedProjection.rendererKind === '3x3-layout' &&
        renderedThreeByThreeProps
            ? renderedThreeByThreeProps
            : renderedProjection.props;

    const waitForNextPaint = () =>
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });

    const commitProjection = async () => {
        if (isDestroyed) return;
        const nextProjection = pendingProjection;
        if (!hasPendingSceneSwitch(renderedProjection, nextProjection)) {
            renderedProjection = nextProjection;
            ({
                committedSceneKey,
                renderedThreeByThreeProps,
            } = createSceneCommitSnapshot(nextProjection));
            onCommittedSceneChange?.(committedSceneKey);
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
        ({
            committedSceneKey,
            renderedThreeByThreeProps,
        } = createSceneCommitSnapshot(renderedProjection));
        onCommittedSceneChange?.(committedSceneKey);
        isSwitchingScene = false;
        if (hasPendingSceneSwitch(renderedProjection, pendingProjection)) {
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
    <svelte:component this={renderedComponent} {...renderedComponentProps} />
{/key}
