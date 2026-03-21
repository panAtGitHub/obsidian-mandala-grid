<script lang="ts">
    import RenderHotkey from './render-hotkey.svelte';
    import EditHotkey from './edit-hotkey.svelte';
    import clx from 'classnames';

    import { CommandName } from '../../../../../../../lang/hotkey-groups';
    import { writable } from 'svelte/store';
    import { getView } from '../../../../context';
    import { onMount } from 'svelte';
    import { focusContainer } from '../../../../../../../stores/view/subscriptions/effects/focus-container';
    import {
        StatefulViewHotkey
    } from '../../../../../../actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';

    export let hotkey: StatefulViewHotkey;
    export let commandName: CommandName;
    export let isPrimary: boolean;
    const view = getView();
    const editing = writable(false);
    onMount(() => {
        let initialRun = true;
        return editing.subscribe(() => {
            if (initialRun) {
                initialRun = false;
            } else {
                focusContainer(view);
            }
        });
    });

    const makeBlank = () => {
        view.plugin.settings.dispatch({
            type: 'settings/hotkeys/set-blank',
            payload: {
                command: commandName,
                type: isPrimary ? 'primary' : 'secondary',
            },
        });
    };
</script>

<div
    aria-label={hotkey.obsidianConflict
        ? `已被 "${hotkey.obsidianConflict}" 使用`
        : hotkey.pluginConflict
          ? `已被 "${hotkey.pluginConflict}" 使用`
          : ''}
    class={clx(
        'hotkey',
        hotkey.obsidianConflict && 'obsidian-conflict',
        hotkey.pluginConflict && 'plugin-conflict',
        hotkey.isCustom && 'hotkey--is-custom',
        $editing && 'editing',
    )}
>
    {#if $editing}
        <EditHotkey
            {hotkey}
            onCancel={() => editing.set(false)}
            {isPrimary}
            {commandName}
        />
    {:else}
        <RenderHotkey
            {hotkey}
            enableEditing={() => editing.set(true)}
            {makeBlank}
        />
    {/if}
</div>

<style>
    .hotkey {
        padding: 5px;
        background-color: var(--color-base-50);
        display: flex;
        gap: 5px;
        border-radius: 3px;
        width: fit-content;
        position: relative;
    }

    .editing {
        background-color: var(--color-base-60);
    }

    .hotkey--is-custom {
        background-color: var(--custom-hotkey-bg);
    }
    .obsidian-conflict {
        background-color: var(--color-red);
    }
    .plugin-conflict {
        background-color: var(--color-orange);
    }
</style>
