<script lang="ts">
    import { afterUpdate, tick, onDestroy } from 'svelte';
    import CardSceneHost from 'src/mandala-scenes/shared/card-scene-host.svelte';
    import NineByNineLayout from 'src/mandala-scenes/view-9x9/layout.svelte';
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
        'card-scene': CardSceneHost,
        '9x9-layout': NineByNineLayout,
    } as const;
    let {
        committedSceneKey: initialCommittedSceneKey,
    } = createSceneCommitSnapshot(projection);
    committedSceneKey = initialCommittedSceneKey;
    $: renderedComponent =
        rendererComponentByKind[renderedProjection.rendererKind];
    $: renderedComponentProps =
        renderedProjection.rendererKind === 'card-scene'
            ? {
                  projection: renderedProjection,
              }
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
            ({ committedSceneKey } = createSceneCommitSnapshot(nextProjection));
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
        ({ committedSceneKey } = createSceneCommitSnapshot(renderedProjection));
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
