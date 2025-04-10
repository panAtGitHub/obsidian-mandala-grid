import { saveNodeContent } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';
import { cancelChanges } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/cancel-changes';
import { DefaultViewCommand } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';

export const editCommands = () => {
    return [
        {
            name: 'enable_edit_mode',
            callback: (view, event) => {
                event.preventDefault();
                view.viewStore.dispatch({
                    type: 'view/editor/enable-main-editor',
                    payload: {
                        nodeId: view.viewStore.getValue().document.activeNode,
                    },
                });
            },
            hotkeys: [
                { key: 'Enter', modifiers: [], editorState: 'editor-off' },
            ],
        },
        {
            name: 'enable_edit_mode_and_place_cursor_at_start',
            callback: (view, event) => {
                event.preventDefault();
                const nodeId = view.viewStore.getValue().document.activeNode;
                view.inlineEditor.setNodeCursor(nodeId, { line: 0, ch: 0 });
                view.viewStore.dispatch({
                    type: 'view/editor/enable-main-editor',
                    payload: {
                        nodeId: nodeId,
                    },
                });
            },
            hotkeys: [
                {
                    key: 'Enter',
                    modifiers: ['Shift'],
                    editorState: 'editor-off',
                },
            ],
        },
        {
            name: 'enable_edit_mode_and_place_cursor_at_end',
            callback: (view, event) => {
                event.preventDefault();
                const nodeId = view.viewStore.getValue().document.activeNode;
                view.inlineEditor.deleteNodeCursor(nodeId);
                view.viewStore.dispatch({
                    type: 'view/editor/enable-main-editor',
                    payload: {
                        nodeId: nodeId,
                    },
                });
            },
            hotkeys: [
                { key: 'Enter', modifiers: ['Alt'], editorState: 'editor-off' },
            ],
        },
        {
            name: 'save_changes_and_exit_card',
            callback: (view) => {
                saveNodeContent(view);
            },
            hotkeys: [
                {
                    key: 'Enter',
                    modifiers: ['Shift', 'Mod'],
                    editorState: 'editor-on',
                },
            ],
        },

        {
            name: 'disable_edit_mode',
            callback: (view) => {
                cancelChanges(view);
            },
            hotkeys: [
                { key: 'Escape', modifiers: [], editorState: 'editor-on' },
            ],
        },
    ] satisfies DefaultViewCommand[];
};
