<script lang="ts">
    import Hotkey from './hotkey/hotkey.svelte';
    import {
        StatefulViewCommand
    } from '../../../../../actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
    import {
        DynamicLabelState,
        getDynamicLabel,
        HotkeysThatBehaveDifferentlyInOutlineMode
    } from 'src/view/components/container/modals/hotkeys/components/helpers/get-dynamic-label';
    import { Info } from 'lucide-svelte';

    export let commandHotkeys: StatefulViewCommand;
    export let labelState: DynamicLabelState;
</script>

<div class="command">
    <span class="label"
        >{getDynamicLabel(commandHotkeys.name, labelState.outlineMode)}

        {#if HotkeysThatBehaveDifferentlyInOutlineMode.has(commandHotkeys.name)}
            <span
                class="info-icon"
                aria-label="在大纲模式下行为不同"
                ><Info class="svg-icon" /></span
            >
        {/if}
    </span>
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

    .info-icon {
        color: #4973A1FF;
        margin-bottom: -4px;

        & svg {
            width: 12px;
            height: 12px;
        }
    }
</style>
