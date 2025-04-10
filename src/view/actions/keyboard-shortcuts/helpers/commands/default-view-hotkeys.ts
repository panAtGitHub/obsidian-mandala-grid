import { navigateCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/navigate-commands';
import { editCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/edit-commands';
import { createCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/create-commands';
import { moveCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/move-commands';
import { mergeCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/merge-commands';
import { historyCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/history-commands';
import { clipboardCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/clipboard-commands';
import { selectionCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/selection-commands';
import { scrollCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/scroll-commands';
import { deleteNode } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/delete-node';
import { LineageView } from 'src/view/view';
import { Hotkey } from 'obsidian';
import { CommandName, GroupName } from 'src/lang/hotkey-groups';
import { get } from 'svelte/store';
import { singleColumnStore } from 'src/stores/document/derived/columns-store';

export type HotkeyEditorState = 'editor-on' | 'editor-off' | 'both';
export type HotkeyPreferences = {
    editorState: HotkeyEditorState;
};
export type ViewHotkey = Hotkey & HotkeyPreferences;
export type PersistedViewHotkey =
    | Hotkey
    | HotkeyPreferences
    | (Hotkey & HotkeyPreferences);
export type DefaultViewCommand = {
    callback: (view: LineageView, event: KeyboardEvent) => void;
    hotkeys: ViewHotkey[];
    name: CommandName;
};
export type StatefulViewHotkey = ViewHotkey & {
    string_representation: string;
    obsidianConflict?: string;
    pluginConflict?: string;
    isCustom?: boolean;
};
export type StatefulViewCommand = DefaultViewCommand & {
    hotkeys: StatefulViewHotkey[];
    group: GroupName;
};

export const defaultViewHotkeys = (): DefaultViewCommand[] => [
    ...navigateCommands(),
    ...editCommands(),
    ...createCommands(),
    ...moveCommands(),
    ...mergeCommands(),
    ...clipboardCommands(),
    ...historyCommands(),
    ...selectionCommands(),
    ...scrollCommands(),
    {
        name: 'delete_card',
        callback: (view, e) => {
            const document = view.viewStore.getValue().document;

            e.preventDefault();
            e.stopPropagation();
            deleteNode(view, document.activeNode, true);
        },
        hotkeys: [
            { key: 'Backspace', modifiers: ['Mod'], editorState: 'editor-off' },
        ],
    },
    {
        name: 'toggle_search_input',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            view.viewStore.dispatch({ type: 'view/search/toggle-input' });
        },
        hotkeys: [
            { key: '/', modifiers: [], editorState: 'editor-off' },
            { key: 'f', modifiers: ['Alt'], editorState: 'both' },
        ],
    },
    {
        name: 'zoom_in',
        callback: (view, e) => {
            e.preventDefault();
            view.plugin.settings.dispatch({
                type: 'settings/view/set-zoom-level',
                payload: { direction: 'in' },
            });
        },
        hotkeys: [{ key: '=', modifiers: ['Mod'], editorState: 'both' }],
    },
    {
        name: 'zoom_out',
        callback: (view, e) => {
            e.preventDefault();
            view.plugin.settings.dispatch({
                type: 'settings/view/set-zoom-level',
                payload: { direction: 'out' },
            });
        },
        hotkeys: [{ key: '-', modifiers: ['Mod'], editorState: 'both' }],
    },
    {
        name: 'zoom_reset',
        callback: (view, e) => {
            e.preventDefault();
            view.plugin.settings.dispatch({
                type: 'settings/view/set-zoom-level',
                payload: { value: 1 },
            });
        },
        hotkeys: [{ key: '0', modifiers: ['Mod'], editorState: 'both' }],
    },
    {
        name: 'toggle_outline_mode',
        callback: (view) => {
            view!.plugin.settings.dispatch({
                type: 'settings/view/modes/toggle-outline-mode',
            });
        },
        hotkeys: [{ key: 'o', modifiers: ['Alt'], editorState: 'both' }],
    },
    {
        name: 'toggle_collapse',
        callback: (view, e) => {
            e.preventDefault();
            if (!get(singleColumnStore(view))) return;
            view.viewStore.dispatch({
                type: 'view/outline/toggle-collapse-node',
                payload: {
                    id: view.viewStore.getValue().document.activeNode,
                },
            });
        },
        hotkeys: [{ key: '=', modifiers: ['Alt'], editorState: 'both' }],
    },
    {
        name: 'toggle_collapse_all',
        callback: (view, e) => {
            e.preventDefault();
            if (!get(singleColumnStore(view))) return;
            view.viewStore.dispatch({
                type: 'view/outline/toggle-collapse-all',
            });
        },
        hotkeys: [{ key: '=', modifiers: ['Alt', 'Mod'], editorState: 'both' }],
    },
];
