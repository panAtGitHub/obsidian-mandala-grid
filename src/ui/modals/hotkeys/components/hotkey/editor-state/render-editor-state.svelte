<script lang="ts">
    import {
        HotkeyEditorState,
        ViewHotkey
    } from '../../../../../../../actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
    import { lang } from 'src/lang/lang';

    export let hotkey: ViewHotkey;
    export let onClick: (() => void) | undefined = undefined;

    const classes: Record<HotkeyEditorState, string> = {
        both: 'editor-state--both',
        'editor-on': 'editor-state--on',
        'editor-off': 'editor-state--off',
    };
    const label: Record<HotkeyEditorState, string> = {
        both: lang.modal_hk_editor_state_both,
        'editor-on': lang.modal_hk_editor_state_on,
        'editor-off': lang.modal_hk_editor_state_off,
    };

    const wrappedOnClick = () => {
        if (onClick) {
            onClick();
        /*    setTimeout(() => {
                if (notice) {
                    notice.hide();
                }
                notice = new Notice(label[hotkey.editorState]);
            }, 16);*/
        }
    };
</script>

<kbd
    class={'editor-state ' +
        classes[hotkey.editorState]}
    aria-label={label[hotkey.editorState]}
    on:click={wrappedOnClick}
>
    <svg
        class="editor-state-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M8 4h1a3 3 0 0 1 3 3 3 3 0 0 1 3-3h1" />
        <path d="M16 20h-1a3 3 0 0 1-3-3 3 3 0 0 1-3 3H8" />
        <path d="M12 7v10" />
        {#if hotkey.editorState === 'editor-off'}
            <path d="M4 5l16 14" />
        {/if}
    </svg>
</kbd
>

<style>
    .editor-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        background-color: var(--color-base-100);
        color: var(--color-base-00);
    }

    .editor-state-icon {
        width: 14px;
        height: 14px;
    }


</style>
