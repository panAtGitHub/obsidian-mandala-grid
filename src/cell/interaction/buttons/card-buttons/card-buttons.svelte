<script lang="ts">
    import EditNodeButton from './components/edit-node-button.svelte';
    import FocusCardButton from './components/focus-card-button.svelte';
    import { ActiveStatus } from 'src/views/view-columns/components/active-status.enum';

    export let editing: boolean;
    export let nodeId: string;
    export let isInSidebar = false;
    export let active: ActiveStatus | null;
    export let alwaysShowCardButtons: boolean;
</script>

{#if active === ActiveStatus.node || alwaysShowCardButtons}
    {#if !editing}
        {#if isInSidebar}
            <FocusCardButton {nodeId} />
        {/if}
    {/if}
    <EditNodeButton {editing} {nodeId} {isInSidebar} />
{/if}
