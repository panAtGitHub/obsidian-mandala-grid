<script lang="ts">
    import { tx } from 'src/lang/translate';
    import Hotkey from './components/command.svelte';
    import type { StatefulViewCommand } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';

    export let group: StatefulViewCommand[];

    export let groupName: string;
</script>

<div class="hotkey-group">
    <div class="hotkey-group-name">{tx(groupName)}</div>
    <div class="hotkeys-list">
        {#each group as commandHotkeys (commandHotkeys.name)}
            <Hotkey {commandHotkeys} />
        {/each}
    </div>
</div>

<style>
    .hotkey-group {
        background-color: var(--background-secondary);
        padding: var(--size-4-2);
        border-radius: 3px;
    }
    .hotkeys-list {
        display: flex;
        flex-direction: column;
        gap: var(--size-4-2);
        overflow-y: auto;
    }

    .hotkey-group-name {
        padding-bottom: 10px;
        padding-left: 5px;
        font-size: 16px;
        color: var(--color-base-70);
    }
</style>
