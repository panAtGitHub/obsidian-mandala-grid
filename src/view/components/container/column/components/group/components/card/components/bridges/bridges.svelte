<script lang="ts">
    import { ActiveStatus } from '../../../active-status.enum';
    import { NodeStyle } from 'src/stores/settings/types/style-rules-types';

    export let editing: boolean;
    export let hasActiveChildren: boolean;
    export let active: ActiveStatus | null;
    export let firstColumn: boolean;
    export let style: NodeStyle | undefined;
</script>

{#if !editing && hasActiveChildren && active === ActiveStatus.node}
    <div
        class="active-node-bridge"
        style="--bg-color: {style && style.styleVariant == 'background-color'
            ? 'transparent'
            : 'var(--background-active-node)'}"
    ></div>
{:else if active === ActiveStatus.parent}
    <div
        class="active-parent-bridge-right"
        style="--bg-color: {style && style.styleVariant == 'background-color'
            ? style.color
            : 'var(--background-active-parent)'}"
    ></div>
    {#if !firstColumn}
        <div
            class="active-parent-bridge-left"
            style="--bg-color: {style && style.styleVariant == 'background-color'
                ? style.color
                : 'var(--background-active-parent)'}"
        ></div>
    {/if}
{/if}

<style>
    .active-node-bridge,
    .active-parent-bridge-right,
    .active-parent-bridge-left {
        height: 100%;

        width: 10px;
        position: absolute;
        top: 0;
    }

    .active-parent-bridge-right {
        right: -10px;
        background-color: var(--bg-color);
    }

    .active-parent-bridge-left {
        width: 7px;
        left: -12px;
        background-color: var(--bg-color);
    }
    .active-node-bridge {
        right: -10px;
        background-color: var(--bg-color);
    }
</style>
