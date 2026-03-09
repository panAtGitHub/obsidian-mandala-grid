import { Settings } from 'src/stores/settings/settings-type';
import {
    defaultViewHotkeys,
    HotkeyEditorState,
    PersistedViewHotkey,
} from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import { CommandName } from 'src/lang/hotkey-groups';
import { ToggleEditorStateAction } from 'src/stores/settings/settings-store-actions';

const getDefaultEditorState = (
    command: CommandName,
    type: 'primary' | 'secondary',
) : HotkeyEditorState => {
    const defaultCommand = defaultViewHotkeys().find(
        (hk) => hk.name === command,
    );
    const defaultHotkey = (
        type === 'primary'
            ? defaultCommand?.hotkeys[0]
            : defaultCommand?.hotkeys[1]
    ) as { editorState?: HotkeyEditorState } | undefined;
    return defaultHotkey?.editorState ?? 'both';
};
const editorStateValues: HotkeyEditorState[] = [
    'editor-on',
    'editor-off',
    'both',
];

const rotateEditorState = (editorState: HotkeyEditorState) => {
    const index = editorStateValues.indexOf(editorState);
    return editorStateValues[(index + 1) % editorStateValues.length];
};

export const toggleEditorState = (
    state: Settings,
    action: ToggleEditorStateAction,
) => {
    let persistedHotkey: PersistedViewHotkey | undefined;
    const fullPersistedHotkey =
        state.hotkeys.customHotkeys[action.payload.command] || {};
    if (fullPersistedHotkey[action.payload.type]) {
        persistedHotkey = fullPersistedHotkey[action.payload.type];
    }
    if (!persistedHotkey || !('editorState' in persistedHotkey)) {
        const defaultEditorState = getDefaultEditorState(
            action.payload.command,
            action.payload.type,
        );

        persistedHotkey = {
            ...(persistedHotkey || {}),
            editorState: defaultEditorState,
        };
    }

    persistedHotkey.editorState = rotateEditorState(
        persistedHotkey.editorState,
    );
    state.hotkeys.customHotkeys = {
        ...state.hotkeys.customHotkeys,
        [action.payload.command]: {
            ...fullPersistedHotkey,
            [action.payload.type]: persistedHotkey,
        },
    };
};
