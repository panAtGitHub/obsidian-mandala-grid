<script lang="ts">
    import { ViewHotkey } from '../../../../../../../actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';

    import EditorState from './render-editor-state.svelte';
    import { CommandName } from '../../../../../../../../lang/hotkey-groups';
    import { getView } from '../../../../../context';

    export let hotkey: ViewHotkey;
    export let commandName: CommandName;
    export let isPrimary: boolean;

    const view = getView();
    const onClick = () => {
        view.plugin.settings.dispatch({
            type: 'settings/hotkeys/toggle-editor-state',
            payload: {
                command: commandName,
                type: isPrimary ? 'primary' : 'secondary',
            },
        });
    };
</script>

<EditorState {hotkey}  {onClick} />
