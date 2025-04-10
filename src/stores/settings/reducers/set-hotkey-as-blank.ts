import { Settings } from 'src/stores/settings/settings-type';
import { PersistedViewHotkey } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';

import { SetHotkeyBlankAction } from 'src/stores/settings/settings-store-actions';

export const setHotkeyAsBlank = (
    state: Settings,
    action: SetHotkeyBlankAction,
) => {
    let persistedHotkey: PersistedViewHotkey | undefined;
    const fullPersistedHotkey =
        state.hotkeys.customHotkeys[action.payload.command] || {};
    if (fullPersistedHotkey[action.payload.type]) {
        persistedHotkey = fullPersistedHotkey[action.payload.type];
    }

    persistedHotkey = {
        ...(persistedHotkey || {}),
        key: '',
        modifiers: [],
    };
    state.hotkeys.customHotkeys = {
        ...state.hotkeys.customHotkeys,
        [action.payload.command]: {
            ...fullPersistedHotkey,
            [action.payload.type]: persistedHotkey,
        },
    };
};
