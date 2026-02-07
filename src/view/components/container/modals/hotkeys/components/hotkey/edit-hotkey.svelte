<script lang="ts">
    import { Hotkey } from 'obsidian';
    import { RotateCcw, X } from 'lucide-svelte';

    import { CommandName } from '../../../../../../../lang/hotkey-groups';
    import {
        Modifiers
    } from '../../../../../../actions/keyboard-shortcuts/helpers/commands/update-view-hotkeys-dictionary';
    import { isMacLike, modKey } from '../../../../../../actions/keyboard-shortcuts/helpers/keyboard-events/mod-key';
    import { focusContainer } from '../../../../../../../stores/view/subscriptions/effects/focus-container';
    import { getView } from '../../../../context';
    import { lang } from '../../../../../../../lang/lang';
    import EditEditorState from './editor-state/edit-editor-state.svelte';
    import {
        StatefulViewHotkey
    } from '../../../../../../actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';

    export let hotkey: StatefulViewHotkey;
    export let commandName: CommandName;
    export let isPrimary: boolean;
    export let onCancel: () => void;
    const view = getView();

    let key = hotkey.key;
    let MOD = hotkey.modifiers.includes('Mod');
    let SHIFT = hotkey.modifiers.includes('Shift');
    let ALT = hotkey.modifiers.includes('Alt');
    let CTRL = hotkey.modifiers.includes('Ctrl');

     
    const onKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === ' ' || e.key === 'META') return;
        key = e.key;
        save();
    };

    const toggleMod = () => {
        MOD = !MOD;
        save();
    };
    const toggleShift = () => {
        SHIFT = !SHIFT;
        save();
    };
    const toggleAlt = () => {
        ALT = !ALT;
        save();
    };
    const toggleCtrl = () => {
        CTRL = !CTRL;
        save();
    };

    const save = () => {
        let modifiers: Hotkey['modifiers'] = [];

        if (MOD) modifiers.push('Mod');
        if (SHIFT) modifiers.push('Shift');
        if (ALT) modifiers.push('Alt');
        if (CTRL && isMacLike) modifiers.push('Ctrl');
        view.plugin.settings.dispatch({
            type: 'settings/hotkeys/set-custom-hotkey',
            payload: {
                hotkey: {
                    key,
                    modifiers,
                },
                type: isPrimary ? 'primary' : 'secondary',
                command: commandName,
            },
        });
    };
     
    const reset = () => {
        view.plugin.settings.dispatch({
            type: 'settings/hotkeys/reset-custom-hotkey',
            payload: {
                command: commandName,
                type: isPrimary ? 'primary' : 'secondary',
            },
        });
        setTimeout(() => {
            MOD = hotkey.modifiers.includes('Mod');
            ALT = hotkey.modifiers.includes('Alt');
            SHIFT = hotkey.modifiers.includes('Shift');
            CTRL = hotkey.modifiers.includes('Ctrl');
            key = hotkey.key;
        });
        focusContainer(view);
    };
</script>

<div class="container">
    <EditEditorState {hotkey} {commandName} {isPrimary}/>
    <div class="hotkey-container">
        <div class="modifiers">
            {#if isMacLike}
                <kbd class={!CTRL ? 'disabled' : ''} on:click={toggleCtrl}
                    >{Modifiers.Ctrl}</kbd
                >
            {/if}
            <kbd class={!MOD ? 'disabled' : ''} on:click={toggleMod}
                >{modKey}</kbd
            >
            <kbd class={!ALT ? 'disabled' : ''} on:click={toggleAlt}
                >{Modifiers.Alt}</kbd
            >
            <kbd class={!SHIFT ? 'disabled' : ''} on:click={toggleShift}
                >{Modifiers.Shift}</kbd
            >
        </div>
        <input
            bind:value={key}
            class="search-input input hotkey-key"
            on:keydown={onKeyDown}
            placeholder="按键"
            spellcheck="false"
            type="text"
        />
    </div>
    <div class="save-and-cancel-buttons">
        <button
            aria-label={lang.modals_hk_editor_cancel}
            class="hotkey-button"
            on:click={onCancel}><X class="svg-icon" size={8} /></button
        >
        <button
            aria-label={lang.settings_reset}
            class="hotkey-button"
            disabled={(hotkey.key.length>0 && !hotkey.isCustom)}
            on:click={reset}><RotateCcw class="svg-icon" size={8} /></button
        >
    </div>
</div>

<style>
    .container {
        display: flex;
        gap: 5px;
        align-items: center;
        justify-content: center;
    }
    .hotkey-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    .input {
        width: 115px;
        height: 25px;
        text-align: center;
        font-size: 14px;
    }

    .modifiers {
        display: flex;
        gap: 5px;
        width: 100%;
        justify-content: center;
    }

    .disabled {
        background-color: var(--color-base-50);
    }

    button:disabled {
        cursor: not-allowed;
    }

    .save-and-cancel-buttons {
        display: flex;
        gap: 5px;
        flex-direction: column;
    }
    .hotkey-button {
        background-color: transparent;
        color: var(--color-base-25);
        border: none;
        width: 20px;
        height: 20px;
        box-shadow: none;
        padding: 2px;
        cursor: pointer;
    }
    .hotkey-key {
        color: lightgrey;
        background-color: #175c5a;
        border-color: #227f7d;
    }

</style>
