import { describe, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import { toggleEditorState } from 'src/mandala-settings/state/reducers/toggle-editor-state';
import { ToggleEditorStateAction } from 'src/mandala-settings/state/settings-store-actions';

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
            payload: { command: 'add_parent_sibling', type: 'primary' },
        };

        toggleEditorState(state, action);

        expect(
            state.hotkeys.customHotkeys.add_parent_sibling?.primary &&
                'editorState' in
                    state.hotkeys.customHotkeys.add_parent_sibling.primary
                ? state.hotkeys.customHotkeys.add_parent_sibling.primary
                      .editorState
                : undefined,
        ).toBe('editor-on');
    });
});
