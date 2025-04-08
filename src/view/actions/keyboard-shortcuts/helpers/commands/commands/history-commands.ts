import { DefaultViewCommand } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';

export const historyCommands = () => {
    return [
        {
            name: 'undo_change',
            callback: (view) => {
                const path = view.documentStore.getValue().file.path;
                if (path)
                    view.documentStore.dispatch({
                        type: 'HISTORY/APPLY_PREVIOUS_SNAPSHOT',
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
                const path = view.documentStore.getValue().file.path;
                if (path)
                    view.documentStore.dispatch({
                        type: 'HISTORY/APPLY_NEXT_SNAPSHOT',
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
