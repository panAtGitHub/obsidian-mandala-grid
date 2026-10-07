<script lang="ts">
    import SceneRuntimeHost from 'src/mandala-scenes/shared/scene-runtime-host.svelte';
    import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
    import type { SceneProjection } from 'src/mandala-scenes/shared/scene-projection';

    export let committed: () => void;
    let committedSceneKey: MandalaSceneKey = {
        viewKind: '9x9',
        variant: 'default',
    };
    let revision = 0;
    let alternate = false;
    let projection: SceneProjection;

    // Match the real parent's feedback: changing the bound key rebuilds the
    // projection with a fresh key object, even when its values are unchanged.
    $: {
        committedSceneKey;
        revision;
        projection = {
            sceneKey: {
                viewKind: '9x9',
                variant: alternate ? 'week-7x9' : 'default',
            },
            rendererKind: '9x9-layout',
            props: {},
        };
    }
</script>

<button on:click={() => revision++}>Refresh</button>
<button on:click={() => (alternate = !alternate)}>Switch</button>
<output>{revision}:{committedSceneKey.variant}</output>
<SceneRuntimeHost
    {projection}
    bind:committedSceneKey
    onCommittedSceneChange={committed}
/>
