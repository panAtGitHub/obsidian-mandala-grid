<script lang="ts">
    import {
        HotkeyEditorState,
        ViewHotkey
    } from '../../../../../../../actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
    import { customIcons } from '../../../../../../../../helpers/load-custom-icons';
    import { lang } from '../../../../../../../../lang/lang';

    export let hotkey: ViewHotkey;
    export let onClick: (() => void) | undefined = undefined;

    const classes: Record<HotkeyEditorState, string> = {
        both: 'editor-state--both',
        'editor-on': 'editor-state--on',
        'editor-off': 'editor-state--off',
    };
    const cursorIcon: Record<HotkeyEditorState, string> = {
        both: customIcons.cursor.svg,
        'editor-on': customIcons.cursor.svg,
        'editor-off': customIcons.cursorOff.svg,
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
    on:click={wrappedOnClick}>{@html cursorIcon[hotkey.editorState]}</kbd
>

<style>
    .editor-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        background-color: var(--color-base-100);
        color: var(--color-base-00);
       /* position: absolute;
        left: -25px;
        top: calc(50% - 9px);*/
        & svg {
            width: 14px;
            height: 14px;
        }
    }


</style>
