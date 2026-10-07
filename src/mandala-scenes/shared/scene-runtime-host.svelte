<script lang="ts">
    import { tick, onDestroy } from 'svelte';
    import CardSceneHost from 'src/mandala-scenes/shared/card-scene-host.svelte';
    import NineByNineLayout from 'src/mandala-scenes/view-9x9/layout.svelte';
    import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
    import {
        type SceneProjection,
        sceneKeyEquals,
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
    let { committedSceneKey: initialCommittedSceneKey } =
        createSceneCommitSnapshot(projection);
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
            window.requestAnimationFrame(() => resolve());
        });

    const commitSceneKey = (nextProjection: SceneProjection) => {
        // The parent derives the projection from this bound key. Publishing
        // an equivalent object would feed another update back into the scene.
        if (sceneKeyEquals(committedSceneKey, nextProjection.sceneKey)) return;
        ({ committedSceneKey } = createSceneCommitSnapshot(nextProjection));
        onCommittedSceneChange?.(committedSceneKey);
    };

    const commitProjection = async () => {
        if (isDestroyed) return;
        const nextProjection = pendingProjection;
        if (nextProjection === renderedProjection) return;
        if (!hasPendingSceneSwitch(renderedProjection, nextProjection)) {
            renderedProjection = nextProjection;
            commitSceneKey(nextProjection);
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
        commitSceneKey(renderedProjection);
        isSwitchingScene = false;
        if (hasPendingSceneSwitch(renderedProjection, pendingProjection)) {
            void commitProjection();
        }
    };

    onDestroy(() => {
        isDestroyed = true;
    });

    // React to incoming projections, rather than every local render.
    $: {
        pendingProjection = projection;
        void commitProjection();
    }
</script>

{#key `${renderedProjection.sceneKey.viewKind}:${renderedProjection.sceneKey.variant}`}
    <svelte:component this={renderedComponent} {...renderedComponentProps} />
{/key}
