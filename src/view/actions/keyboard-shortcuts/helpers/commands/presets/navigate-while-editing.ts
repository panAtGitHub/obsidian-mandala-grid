import { Modifier } from 'obsidian';
import { CustomHotkeys } from 'src/mandala-settings/state/settings-type';

const modifiers = ['Alt', 'Shift'] as Modifier[];
export const NavigateWhileEditing: CustomHotkeys = {
    go_right: {
        secondary: {
            key: 'ArrowRight',
            modifiers: modifiers,
            editorState: 'both',
        },
    },
    go_left: {
        secondary: {
            key: 'ArrowLeft',
            modifiers: modifiers,
            editorState: 'both',
        },
    },
    go_down: {
        secondary: {
            key: 'ArrowDown',
            modifiers: modifiers,
            editorState: 'both',
        },
    },
    go_up: {
        secondary: {
            key: 'ArrowUp',
            modifiers: modifiers,
            editorState: 'both',
        },
    },
    go_to_beginning_of_column: {
        primary: {
            key: 'Home',
            modifiers: modifiers,
            editorState: 'both',
        },
    },
    go_to_end_of_column: {
        primary: {
            key: 'End',
            modifiers: modifiers,
            editorState: 'both',
        },
    },
    go_to_end_of_group: {
        primary: {
            key: 'PageDown',
            modifiers: modifiers,
            editorState: 'both',
        },
    },
    go_to_beginning_of_group: {
        primary: {
            key: 'PageUp',
            modifiers: modifiers,
            editorState: 'both',
        },
    },
    move_node_up: {
        secondary: {
            key: 'ArrowUp',
            modifiers: ['Alt', 'Mod', 'Shift'],
        },
    },
    move_node_down: {
        secondary: {
            key: 'ArrowDown',
            modifiers: ['Alt', 'Mod', 'Shift'],
        },
    },
    move_node_right: {
        secondary: {
            key: 'ArrowRight',
            modifiers: ['Alt', 'Mod', 'Shift'],
        },
    },
    move_node_left: {
        secondary: {
            key: 'ArrowLeft',
            modifiers: ['Mod', 'Shift', 'Alt'],
        },
    },
};
