<script lang="ts">
    import Hotkey from './hotkey/hotkey.svelte';
    import {
        StatefulViewCommand
    } from '../../../../../actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
    import {
        getDynamicLabel,
    } from 'src/view/components/container/modals/hotkeys/components/helpers/get-dynamic-label';

    export let commandHotkeys: StatefulViewCommand;
</script>

<div class="command">
    <span class="label"
        >{getDynamicLabel(commandHotkeys.name)}</span
    >
    <div class="hotkeys">
        {#if commandHotkeys.hotkeys[0]}
            <Hotkey
                hotkey={commandHotkeys.hotkeys[0]}
                commandName={commandHotkeys.name}
                isPrimary={true}
            />
        {/if}
    </div>
</div>

<style>
    .command {
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 4px;
        gap: 8px;
        background-color: var(--color-base-30);
        flex-wrap: wrap;
    }

    .hotkeys {
        display: flex;
        flex-direction: column;
        align-items: end;
        gap: 5px;
    }

    .label {
        font-size: 14px;
        color: var(--text-normal);
        position: relative;
        display: flex;
        align-items: center;
        gap: 5px;
    }
</style>
