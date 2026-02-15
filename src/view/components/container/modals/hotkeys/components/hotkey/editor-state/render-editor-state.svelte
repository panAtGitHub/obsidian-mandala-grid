<script lang="ts">
    import {
        HotkeyEditorState,
        ViewHotkey
    } from '../../../../../../../actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
    import { lang } from '../../../../../../../../lang/lang';

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
    const shortLabel: Record<HotkeyEditorState, string> = {
        both: '全部',
        'editor-on': '编辑',
        'editor-off': '浏览',
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
    <span>{shortLabel[hotkey.editorState]}</span>
</kbd
>

<style>
    .editor-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px 4px;
        background-color: var(--color-base-100);
        color: var(--color-base-00);
        font-size: 11px;
        line-height: 1;
    }


</style>
