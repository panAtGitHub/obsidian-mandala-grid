import Lineage from 'src/main';
import { updateViewHotkeysDictionary } from 'src/view/actions/keyboard-shortcuts/helpers/commands/update-view-hotkeys-dictionary';
import { get } from 'svelte/store';
import { ViewHotkeysStore } from 'src/stores/settings/derived/view-hotkeys-store';

export const settingsSubscriptions = (plugin: Lineage) => {
    return plugin.settings.subscribe((state, action, initialRun) => {
        plugin.viewType = state.documents;
        if (initialRun) {
            updateViewHotkeysDictionary(get(ViewHotkeysStore(plugin)));
        } else if (action) {
            if (
                action.type === 'settings/hotkeys/reset-all' ||
                action.type === 'settings/hotkeys/apply-preset' ||
                action.type === 'settings/hotkeys/reset-custom-hotkey' ||
                action.type === 'settings/hotkeys/set-custom-hotkey' ||
                action.type === 'settings/hotkeys/toggle-editor-state' ||
                action.type === 'settings/hotkeys/set-blank'
            ) {
                updateViewHotkeysDictionary(get(ViewHotkeysStore(plugin)));
            }
        }
    });
};
