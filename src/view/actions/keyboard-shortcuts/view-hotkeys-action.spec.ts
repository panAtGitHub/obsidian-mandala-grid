// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { viewHotkeysAction } from 'src/view/actions/keyboard-shortcuts/view-hotkeys-action';
import { viewHotkeys } from 'src/view/actions/keyboard-shortcuts/helpers/commands/update-view-hotkeys-dictionary';

type ScopeHandler = (event: KeyboardEvent) => false | void;

type ScopeStub = {
    register: ReturnType<typeof vi.fn<[unknown, unknown, ScopeHandler], ScopeHandler>>;
    unregister: ReturnType<typeof vi.fn<[ScopeHandler], void>>;
};

type ViewStub = {
    scope: ScopeStub;
    viewStore: {
        getValue: () => {
            document: {
                editing: {
                    activeNodeId: null;
                };
            };
        };
        dispatch: ReturnType<typeof vi.fn>;
    };
};

describe('viewHotkeysAction', () => {
    beforeEach(() => {
        viewHotkeys.current = {};
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

        let scopeHandler: ((event: KeyboardEvent) => false | void) | null = null;
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

        let scopeHandler: ((event: KeyboardEvent) => false | void) | null = null;
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
});
