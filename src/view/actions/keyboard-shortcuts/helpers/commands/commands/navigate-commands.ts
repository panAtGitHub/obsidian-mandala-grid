import { MandalaView } from 'src/view/view';
import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import { DefaultViewCommand } from 'src/view/actions/keyboard-shortcuts/helpers/commands/default-view-hotkeys';
import { tryMandala3x3Navigation } from 'src/mandala-interaction/keyboard/try-mandala-3x3-navigation';
import { tryMandalaNx9Navigation } from 'src/mandala-scenes/view-nx9/navigation';
import { tryMandala9x9Navigation } from 'src/mandala-interaction/keyboard/try-mandala-9x9-navigation';
import { tryMandalaWeek7x9Navigation } from 'src/mandala-interaction/keyboard/try-mandala-week-7x9-navigation';

const spatialNavigation = (view: MandalaView, direction: AllDirections) => {
    if (view.mandalaMode === '3x3') {
        if (tryMandala3x3Navigation(view, direction)) return;
    }
    if (view.mandalaMode === '9x9') {
        if (tryMandala9x9Navigation(view, direction)) return;
    }
    if (view.mandalaMode === 'nx9') {
        if (view.isWeekPlanVariant()) {
            if (tryMandalaWeek7x9Navigation(view, direction)) return;
        }
        if (tryMandalaNx9Navigation(view, direction)) return;
    }
    view.viewStore.dispatch({
        type: 'view/set-active-node/keyboard',
        payload: {
            direction: direction,
        },
    });
};

export const navigateCommands = () => {
    const commands: DefaultViewCommand[] = [];
    commands.push(
        {
            name: 'go_right',
            callback: (view, event) => {
                event.preventDefault();
                spatialNavigation(view, 'right');
            },
            hotkeys: [
                { key: 'L', modifiers: [], editorState: 'editor-off' },
                { key: 'ArrowRight', modifiers: [], editorState: 'editor-off' },
            ],
        },
        {
            name: 'go_left',
            callback: (view, event) => {
                event.preventDefault();
                spatialNavigation(view, 'left');
            },
            hotkeys: [
                { key: 'H', modifiers: [], editorState: 'editor-off' },
                { key: 'ArrowLeft', modifiers: [], editorState: 'editor-off' },
            ],
        },
        {
            name: 'go_down',
            callback: (view, event) => {
                event.preventDefault();
                spatialNavigation(view, 'down');
            },
            hotkeys: [
                { key: 'J', modifiers: [], editorState: 'editor-off' },
                { key: 'ArrowDown', modifiers: [], editorState: 'editor-off' },
            ],
        },
        {
            name: 'go_up',
            callback: (view, event) => {
                event.preventDefault();
                spatialNavigation(view, 'up');
            },
            hotkeys: [
                { key: 'K', modifiers: [], editorState: 'editor-off' },
                { key: 'ArrowUp', modifiers: [], editorState: 'editor-off' },
            ],
        },
        /* {
            name: 'select_parent',
            callback: (view, event) => {
                event.preventDefault();
                spatialNavigation(view, 'left');
            },
            hotkeys: [{ key: 'G', modifiers: [], editorState: 'editor-off' }],
        },
        {
            name: 'navigate_to_next_node',
            callback: (view, event) => {
                event.preventDefault();
                sequentialNavigation(view, 'forward');
            },
            hotkeys: [{ key: 'N', modifiers: [], editorState: 'editor-off' }],
        },
        {
            name: 'navigate_to_previous_node',
            callback: (view, event) => {
                event.preventDefault();
                sequentialNavigation(view, 'back');
            },
            hotkeys: [{ key: 'B', modifiers: [], editorState: 'editor-off' }],
        },
        {
            name: 'go_to_beginning_of_group',
            callback: (view, e) => {
                e.preventDefault();
                e.stopPropagation();
                jump(view, 'start-of-group');
            },
            hotkeys: [
                { key: 'PageUp', modifiers: [], editorState: 'editor-off' },
            ],
        },
        {
            name: 'go_to_end_of_group',
            callback: (view, e) => {
                e.preventDefault();
                e.stopPropagation();
                jump(view, 'end-of-group');
            },
            hotkeys: [
                { key: 'PageDown', modifiers: [], editorState: 'editor-off' },
            ],
        },
        {
            name: 'go_to_beginning_of_column',
            callback: (view, e) => {
                e.preventDefault();
                e.stopPropagation();
                jump(view, 'start-of-column');
            },
            hotkeys: [
                { key: 'Home', modifiers: [], editorState: 'editor-off' },
            ],
        },
        {
            name: 'go_to_end_of_column',
            callback: (view, e) => {
                e.preventDefault();
                e.stopPropagation();
                jump(view, 'end-of-column');
            },
            hotkeys: [{ key: 'End', modifiers: [], editorState: 'editor-off' }],
        }, */
    );
    return commands;
};
