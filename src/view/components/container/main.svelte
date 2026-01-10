<script lang="ts">
    import { LineageView } from '../../view';
    import Lineage from '../../../main';
    import { setContext } from 'svelte';
    import { viewHotkeysAction } from 'src/view/actions/keyboard-shortcuts/view-hotkeys-action';
    import { mouseWheelZoom } from 'src/view/actions/mouse-wheel-zoom';
    import { showContextMenu } from 'src/view/actions/context-menu/show-context-menu';
    import MandalaView from 'src/view/components/mandala/mandala-view.svelte';

    export let plugin: Lineage;
    export let view: LineageView;
    setContext('plugin', plugin);
    setContext('view', view);
</script>

<div
    class="lineage-view"
    use:viewHotkeysAction={{ view }}
    use:showContextMenu={view}
    tabindex="0"
>
    <div class={`lineage-main`} use:mouseWheelZoom={view}>
        <MandalaView />
    </div>
</div>

<style>
    .lineage-main {
        display: flex;
        height: 100%;
        flex: 1 1 auto;
        width: 0; /* ensures it shrinks properly when the minimap is visible */
        position: relative;
    }

    .lineage-view {
        background-color: var(--background-container);
        display: flex;
        height: 100%;
        width: 100%;
    }
</style>
