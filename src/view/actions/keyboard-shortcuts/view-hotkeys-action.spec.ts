// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { viewHotkeysAction } from 'src/view/actions/keyboard-shortcuts/view-hotkeys-action';
import { viewHotkeys } from 'src/view/actions/keyboard-shortcuts/helpers/commands/update-view-hotkeys-dictionary';
import { getUsedHotkeys } from 'src/obsidian/helpers/get-used-hotkeys';
import { isMacLike } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/mod-key';

vi.mock('src/obsidian/helpers/get-used-hotkeys', () => ({
    getUsedHotkeys: vi.fn(() => new Map<string, string>()),
}));

type ScopeHandler = (event: KeyboardEvent) => false | void;

type ScopeStub = {
    register: ReturnType<
        typeof vi.fn<[unknown, unknown, ScopeHandler], ScopeHandler>
    >;
    unregister: ReturnType<typeof vi.fn<[ScopeHandler], void>>;
};

type ViewStub = {
    scope: ScopeStub;
    viewStore: {
        getValue: () => {
            document: {
                editing: {
                    activeNodeId: string | null;
                };
            };
        };
        dispatch: ReturnType<typeof vi.fn>;
    };
};

describe('viewHotkeysAction', () => {
    beforeEach(() => {
        viewHotkeys.current = {};
        vi.mocked(getUsedHotkeys).mockReturnValue(new Map());
    });

    const createView = (): ViewStub => ({
        scope: {
            register: vi.fn<[unknown, unknown, ScopeHandler], ScopeHandler>(),
            unregister: vi.fn<[ScopeHandler], void>(),
        },
        viewStore: {
            getValue: () => ({
                document: {
                    editing: {
                        activeNodeId: null,
                    },
                },
            }),
            dispatch: vi.fn(),
        },
    });

    it('does not run scope hotkeys when focus is inside a search input', () => {
        const callback = vi.fn();
        viewHotkeys.current.ARROWDOWN = {
            name: 'go_down',
            callback,
            editorState: 'editor-off',
            group: '导航',
        };

        let scopeHandler: ((event: KeyboardEvent) => false | void) | null =
            null;
        const unregister = vi.fn<[ScopeHandler], void>();
        const target = document.createElement('div');
        const input = document.createElement('input');
        target.appendChild(input);

        const view = createView();
        view.scope.register = vi.fn((_mods, _key, handler) => {
            scopeHandler = handler;
            return handler;
        });
        view.scope.unregister = unregister;

        const destroy = viewHotkeysAction(target, { view: view as never });

        const event = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: input });

        expect(scopeHandler).not.toBeNull();
        expect(scopeHandler!(event)).toBeUndefined();
        expect(callback).not.toHaveBeenCalled();

        destroy.destroy();
        expect(unregister).toHaveBeenCalled();
    });

    it('runs scope hotkeys for regular view targets', () => {
        const callback = vi.fn();
        viewHotkeys.current.ARROWDOWN = {
            name: 'go_down',
            callback,
            editorState: 'editor-off',
            group: '导航',
        };

        let scopeHandler: ((event: KeyboardEvent) => false | void) | null =
            null;
        const target = document.createElement('div');
        const cell = document.createElement('div');
        target.appendChild(cell);

        const view = createView();
        view.scope.register = vi.fn((_mods, _key, handler) => {
            scopeHandler = handler;
            return handler;
        });

        const destroy = viewHotkeysAction(target, { view: view as never });

        const event = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
        });
        Object.defineProperty(event, 'target', { value: cell });

        expect(scopeHandler).not.toBeNull();
        expect(scopeHandler!(event)).toBe(false);
        expect(callback).toHaveBeenCalledOnce();

        destroy.destroy();
    });

    it('yields conflicting hotkeys to Obsidian only while editing', () => {
        const callback = vi.fn();
        viewHotkeys.current.ARROWUPMod = {
            name: 'jump_core_prev',
            callback,
            editorState: 'both',
            group: '导航',
        };
        vi.mocked(getUsedHotkeys).mockReturnValue(
            new Map([['ARROWUPMod', 'Move line up']]),
        );
        const view = createView();
        let editing: string | null = 'node-1';
        view.viewStore.getValue = () => ({
            document: { editing: { activeNodeId: editing } },
        });
        const target = document.createElement('div');
        const action = viewHotkeysAction(target, { view: view as never });
        const handler = view.scope.register.mock.calls[0][2];
        const event = new KeyboardEvent('keydown', {
            key: 'ArrowUp',
            ctrlKey: !isMacLike,
            metaKey: isMacLike,
        });
        Object.defineProperty(event, 'target', { value: target });

        expect(handler(event)).toBeUndefined();
        expect(callback).not.toHaveBeenCalled();
        vi.mocked(getUsedHotkeys).mockReturnValue(new Map());
        expect(handler(event)).toBe(false);
        expect(callback).toHaveBeenCalledOnce();
        callback.mockClear();
        vi.mocked(getUsedHotkeys).mockReturnValue(
            new Map([['ARROWUPMod', 'Move line up']]),
        );
        editing = null;
        expect(handler(event)).toBe(false);
        expect(callback).toHaveBeenCalledOnce();
        action.destroy();
    });
});
