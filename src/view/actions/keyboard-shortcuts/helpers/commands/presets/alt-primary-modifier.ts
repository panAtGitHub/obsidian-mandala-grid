import { CustomHotkeys } from 'src/stores/settings/settings-type';

export const AltPrimaryModifier: CustomHotkeys = {
    /*
    navigate_back: {
        primary: {
            key: 'J',
            modifiers: ['Alt', 'Mod', 'Shift'],
        },
    },
    navigate_forward: {
        primary: {
            key: 'K',
            modifiers: ['Alt', 'Mod', 'Shift'],
        },
    },
    */
    add_below_and_split: {
        primary: {
            key: 'J',
            modifiers: ['Alt'],
        },
    },
    add_above_and_split: {
        primary: {
            key: 'K',
            modifiers: ['Alt'],
        },
    },
    add_child_and_split: {
        primary: {
            key: 'L',
            modifiers: ['Alt'],
        },
    },
    delete_card: {
        primary: {
            key: 'Backspace',
            modifiers: ['Alt'],
        },
    },
    save_changes_and_exit_card: {
        primary: {
            key: 'Enter',
            modifiers: ['Alt', 'Shift'],
        },
    },
    add_above: {
        primary: {
            key: 'ArrowUp',
            modifiers: ['Alt'],
        },
    },
    add_below: {
        primary: {
            key: 'ArrowDown',
            modifiers: ['Alt'],
        },
    },
    add_child: {
        primary: {
            key: 'ArrowRight',
            modifiers: ['Alt'],
        },
    },
    add_parent_sibling: {
        secondary: {
            key: 'H',
            modifiers: ['Alt'],
        },
        primary: {
            key: 'ArrowLeft',
            modifiers: ['Alt'],
        },
    },
};
