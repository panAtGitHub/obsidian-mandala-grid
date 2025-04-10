import { DefaultViewCommand } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';

export const historyCommands = () => {
    return [
        {
            name: 'undo_change',
            callback: (view) => {
                view.documentStore.dispatch({
                    type: 'document/history/select-previous-snapshot',
                });
            },
            hotkeys: [
                {
                    key: 'Z',
                    modifiers: ['Mod'],
                    editorState: 'editor-off',
                },
            ],
        },
        {
            name: 'redo_change',
            callback: (view) => {
                view.documentStore.dispatch({
                    type: 'document/history/select-next-snapshot',
                });
            },
            hotkeys: [
                {
                    key: 'Y',
                    modifiers: ['Mod'],
                    editorState: 'editor-off',
                },
                {
                    key: 'Z',
                    modifiers: ['Mod', 'Shift'],
                    editorState: 'editor-off',
                },
            ],
        },
    ] satisfies DefaultViewCommand[];
};
