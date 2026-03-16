import { Hotkey } from 'obsidian';
import { normalizeHotkeyKey } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/normalize-hotkey-key';

export const hotkeyToString = (hotkey: Hotkey) =>
    normalizeHotkeyKey(hotkey.key).toUpperCase() +
    hotkey.modifiers.sort().join('');
