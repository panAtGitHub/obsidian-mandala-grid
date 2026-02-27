import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/stores/settings/default-settings';
import { toggleEditorState } from 'src/stores/settings/reducers/toggle-editor-state';
import { ToggleEditorStateAction } from 'src/stores/settings/settings-store-actions';

describe('toggleEditorState', () => {
    test('uses "both" fallback when command has no default hotkeys', () => {
        const state = DEFAULT_SETTINGS();
        const action: ToggleEditorStateAction = {
            type: 'settings/hotkeys/toggle-editor-state',
            payload: { command: 'enter_subgrid', type: 'primary' },
        };

        expect(() => toggleEditorState(state, action)).not.toThrow();
        expect(
            state.hotkeys.customHotkeys.enter_subgrid?.primary &&
                'editorState' in state.hotkeys.customHotkeys.enter_subgrid.primary
                ? state.hotkeys.customHotkeys.enter_subgrid.primary.editorState
                : undefined,
        ).toBe('editor-on');
    });

    test('falls back when removed command has no defaults', () => {
        const state = DEFAULT_SETTINGS();
        const action: ToggleEditorStateAction = {
            type: 'settings/hotkeys/toggle-editor-state',
            payload: { command: 'undo_change', type: 'primary' },
        };

        toggleEditorState(state, action);

        expect(
            state.hotkeys.customHotkeys.undo_change?.primary &&
                'editorState' in state.hotkeys.customHotkeys.undo_change.primary
                ? state.hotkeys.customHotkeys.undo_change.primary.editorState
                : undefined,
        ).toBe('editor-on');
    });
});
