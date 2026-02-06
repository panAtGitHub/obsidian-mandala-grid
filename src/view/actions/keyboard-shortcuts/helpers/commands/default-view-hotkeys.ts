import { navigateCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/navigate-commands';
import { editCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/edit-commands';
import { historyCommands } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/history-commands';
import { MandalaView } from 'src/view/view';
import { Hotkey } from 'obsidian';
import { CommandName, GroupName } from 'src/lang/hotkey-groups';
import {
    enterSubgridForNode,
    exitCurrentSubgrid
} from 'src/view/helpers/mandala/mobile-navigation';
import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';

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
    callback: (view: MandalaView, event: KeyboardEvent) => void;
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

export const defaultViewHotkeys = (): DefaultViewCommand[] => {
    const commands: DefaultViewCommand[] = [
        ...navigateCommands(),
        ...editCommands(),
        // ...createCommands(),
        // ...moveCommands(),
        // ...mergeCommands(),
        // ...clipboardCommands(),
        ...historyCommands(),
        // ...selectionCommands(),
        // ...scrollCommands(),
        /* {
        name: 'move_node_up',
        callback: (view) => {
            if (view.mandalaMode === '3x3') swapMandalaCell(view, 'up');
            else moveNode(view, 'up');
        },
        hotkeys: [
            { key: 'K', modifiers: ['Alt', 'Shift'], editorState: 'both' },
            {
                key: 'ArrowUp',
                modifiers: ['Alt', 'Shift'],
                editorState: 'both',
            },
        ],
    },
    {
        name: 'move_node_down',
        callback: (view) => {
            if (view.mandalaMode === '3x3') swapMandalaCell(view, 'down');
            else moveNode(view, 'down');
        },
        hotkeys: [
            { key: 'J', modifiers: ['Alt', 'Shift'], editorState: 'both' },
            {
                key: 'ArrowDown',
                modifiers: ['Alt', 'Shift'],
                editorState: 'both',
            },
        ],
    },
    {
        name: 'move_node_right',
        callback: (view) => {
            if (view.mandalaMode === '3x3') swapMandalaCell(view, 'right');
            else moveNode(view, 'right');
        },
        hotkeys: [
            { key: 'L', modifiers: ['Alt', 'Shift'], editorState: 'both' },
            {
                key: 'ArrowRight',
                modifiers: ['Alt', 'Shift'],
                editorState: 'both',
            },
        ],
    },
    {
        name: 'move_node_left',
        callback: (view) => {
            if (view.mandalaMode === '3x3') swapMandalaCell(view, 'left');
            else moveNode(view, 'left');
        },
        hotkeys: [
            { key: 'H', modifiers: ['Alt', 'Shift'], editorState: 'both' },
            {
                key: 'ArrowLeft',
                modifiers: ['Alt', 'Shift'],
                editorState: 'both',
            },
        ],
    }, */
    /* {
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
    }, */
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
    /* {
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
    }, */
    /*{
        name: 'toggle_outline_mode',
        callback: (view) => {
            view!.plugin.settings.dispatch({
                type: 'settings/view/modes/toggle-outline-mode',
            });
        },
        hotkeys: [{ key: 'o', modifiers: ['Alt'], editorState: 'both' }],
    },*/
    /* {
        name: 'toggle_mandala_mode',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            view.plugin.settings.dispatch({
                type: 'settings/view/mandala/toggle-mode',
            });
        },
        hotkeys: [],
    }, */
    {
        name: 'enter_subgrid',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();

            const state = view.viewStore.getValue();
            const activeNodeId = state.document.activeNode;
            enterSubgridForNode(view, activeNodeId);
        },
        hotkeys: [],
    },
    {
        name: 'exit_subgrid',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            exitCurrentSubgrid(view);
        },
        hotkeys: [],
    },
    {
        name: 'jump_core_next',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            jumpCoreTheme(view, 'down');
        },
        hotkeys: [
            {
                key: 'ArrowDown',
                modifiers: ['Mod', 'Shift'],
                editorState: 'editor-off',
            },
        ],
    },
    {
        name: 'jump_core_prev',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            jumpCoreTheme(view, 'up');
        },
        hotkeys: [
            {
                key: 'ArrowUp',
                modifiers: ['Mod', 'Shift'],
                editorState: 'editor-off',
            },
        ],
    },
    {
        name: 'toggle_mandala_mode',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            view.plugin.settings.dispatch({
                type: 'settings/view/mandala/toggle-mode',
            });
        },
        hotkeys: [],
    },
    /* {
        name: 'swap_cell_up',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            swapMandalaCell(view, 'up');
        },
        hotkeys: [],
    },
    {
        name: 'swap_cell_down',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            swapMandalaCell(view, 'down');
        },
        hotkeys: [],
    },
    {
        name: 'swap_cell_left',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            swapMandalaCell(view, 'left');
        },
        hotkeys: [],
    },
    {
        name: 'swap_cell_right',
        callback: (view, e) => {
            e.preventDefault();
            e.stopPropagation();
            swapMandalaCell(view, 'right');
        },
        hotkeys: [],
    }, */
    /* {
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
    }, */
    ];

    return commands.map((command) => ({
        ...command,
        hotkeys: command.hotkeys.map((hotkey) => ({
            ...hotkey,
            key: '',
            modifiers: [],
        })),
    }));
};
