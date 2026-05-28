import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('obsidian', () => ({
    Editor: class {},
    MarkdownView: class {},
}));

vi.mock(
    'src/obsidian/helpers/inline-editor/helpers/vim-enter-insert-mode',
    () => ({
        vimEnterInsertMode: vi.fn(),
    }),
);
vi.mock(
    'src/obsidian/helpers/inline-editor/helpers/fix-vim-cursor-when-zooming',
    () => ({
        fixVimCursorWhenZooming: vi.fn(() => null),
    }),
);
vi.mock('src/obsidian/helpers/inline-editor/helpers/lock-file', () => ({
    lockFile: vi.fn(),
}));
vi.mock('src/obsidian/helpers/inline-editor/helpers/unlock-file', () => ({
    unlockFile: vi.fn(),
}));

import { InlineEditor } from 'src/obsidian/helpers/inline-editor/inline-editor';

type InlineEditorTestView = {
    file: object | null;
    getMandalaSceneKey: () => {
        viewKind: string;
        variant: string;
    };
    plugin: {
        app: {
            workspace: {
                activeEditor: unknown;
                _activeEditor?: unknown;
            };
        };
    };
    documentStore: {
        getValue: () => {
            document: {
                content: Record<string, { content?: string }>;
            };
        };
    };
    viewStore: {
        getValue: () => {
            document: {
                editing: {
                    isInSidebar: boolean;
                };
            };
        };
    };
    editSession: {
        startSession: ReturnType<typeof vi.fn>;
        switchNode: ReturnType<typeof vi.fn>;
        updateBuffer: ReturnType<typeof vi.fn>;
        requestSave: ReturnType<typeof vi.fn>;
        requestBlurCommit: ReturnType<typeof vi.fn>;
        endSession: ReturnType<typeof vi.fn>;
        cancel: ReturnType<typeof vi.fn>;
    };
};

const createTestView = (): InlineEditorTestView => ({
    file: {},
    getMandalaSceneKey: () => ({
        viewKind: '3x3',
        variant: 'default',
    }),
    plugin: {
        app: {
            workspace: {
                activeEditor: null,
                _activeEditor: null,
            },
        },
    },
    documentStore: {
        getValue: () => ({
            document: {
                content: {
                    'node-1': { content: 'first' },
                    'node-2': { content: 'second' },
                },
            },
        }),
    },
    viewStore: {
        getValue: () => ({
            document: {
                editing: {
                    isInSidebar: false,
                },
            },
        }),
    },
    editSession: {
        startSession: vi.fn(),
        switchNode: vi.fn(),
        updateBuffer: vi.fn(),
        requestSave: vi.fn(),
        requestBlurCommit: vi.fn(),
        endSession: vi.fn(),
        cancel: vi.fn(),
    },
});

type MockElement = {
    append: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    empty: ReturnType<typeof vi.fn>;
    contains: (value: unknown) => boolean;
};

const createMockElement = (): MockElement => {
    const children = new Set<unknown>();
    const self: MockElement = {
        append: vi.fn((child: unknown) => {
            children.add(child);
        }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        empty: vi.fn(() => {
            children.clear();
        }),
        contains: (value: unknown) => value === self || children.has(value),
    };
    return self;
};

const attachEditorInternals = (
    editor: InlineEditor,
    value = 'content',
    cursor = { line: 0, ch: 0 },
) => {
    let currentValue = value;
    const editorApi = {
        getValue: vi.fn(() => currentValue),
        getCursor: vi.fn(() => cursor),
        refresh: vi.fn(),
        focus: vi.fn(),
        lastLine: vi.fn(() => currentValue.split('\n').length - 1),
        getLine: vi.fn((line: number) => currentValue.split('\n')[line] ?? ''),
        setCursor: vi.fn(),
    };

    const mandalaSetViewData = vi.fn((nextValue: string) => {
        currentValue = nextValue;
    });

    (editor as unknown as { inlineView: unknown }).inlineView = {
        editor: editorApi,
        mandalaSetViewData,
    };
    (editor as unknown as { containerEl: unknown }).containerEl =
        createMockElement();

    return editorApi;
};

describe('inline-editor edit-session integration', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
            cb();
            return 0;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('routes save requests to editSession.requestSave without ending session', () => {
        const view = createTestView();
        const editor = new InlineEditor(view as never);
        attachEditorInternals(editor, 'saved');
        editor.nodeId = 'node-1';

        editor.requestSave();

        expect(view.editSession.updateBuffer).toHaveBeenCalledWith('saved');
        expect(view.editSession.requestSave).toHaveBeenCalledTimes(1);
        expect(view.editSession.endSession).not.toHaveBeenCalled();
    });

    it('commits on blur via requestBlurCommit and keeps session alive', () => {
        const view = createTestView();
        const editor = new InlineEditor(view as never);
        attachEditorInternals(editor, 'blurred');
        const target = createMockElement();
        (editor as unknown as { target: MockElement | null }).target = target;
        editor.nodeId = 'node-1';

        (
            editor as unknown as {
                handleEditorFocusOut: (event: FocusEvent) => void;
            }
        ).handleEditorFocusOut({
            relatedTarget: {},
        } as FocusEvent);

        expect(view.editSession.updateBuffer).toHaveBeenCalledWith('blurred');
        expect(view.editSession.requestBlurCommit).toHaveBeenCalledTimes(1);
        expect(editor.nodeId).toBe('node-1');
    });

    it('switches node through editSession.switchNode instead of disable-edit unload', () => {
        const view = createTestView();
        const editor = new InlineEditor(view as never);
        attachEditorInternals(editor, 'before-switch', { line: 2, ch: 1 });
        (
            editor as unknown as { setContent: (content: string) => void }
        ).setContent = vi.fn();
        (editor as unknown as { focus: () => void }).focus = vi.fn();
        (editor as unknown as { restoreCursor: () => void }).restoreCursor =
            vi.fn();
        (editor as unknown as { lockFile: () => void }).lockFile = vi.fn();
        (
            editor as unknown as { fixVimWhenZooming: () => void }
        ).fixVimWhenZooming = vi.fn();

        const previousTarget = createMockElement();
        const nextTarget = createMockElement();
        (editor as unknown as { target: MockElement | null }).target =
            previousTarget;
        editor.nodeId = 'node-1';

        view.documentStore.getValue = () => ({
            document: {
                content: {
                    'node-1': { content: 'first' },
                    'node-2': { content: 'next-content' },
                },
            },
        });

        editor.loadNode(nextTarget as unknown as HTMLElement, 'node-2');

        expect(view.editSession.updateBuffer).toHaveBeenCalledWith(
            'before-switch',
        );
        expect(view.editSession.switchNode).toHaveBeenCalledWith(
            'node-2',
            false,
            'next-content',
        );
        expect(view.editSession.endSession).not.toHaveBeenCalled();
        expect(editor.nodeId).toBe('node-2');
    });

    it('places the first day-plan edit cursor at the line below the heading when only a heading exists', () => {
        const view = createTestView();
        view.getMandalaSceneKey = () => ({
            viewKind: '3x3',
            variant: 'day-plan',
        });
        view.documentStore.getValue = () => ({
            document: {
                content: {
                    'node-1': { content: '## 2026-02-10 二' },
                    'node-2': { content: 'second' },
                },
            },
        });

        const editor = new InlineEditor(view as never);
        const editorApi = attachEditorInternals(editor, '## 2026-02-10 二\n');
        const target = createMockElement();

        editor.loadNode(target as unknown as HTMLElement, 'node-1');

        expect(
            (
                editor as unknown as {
                    inlineView: {
                        mandalaSetViewData: ReturnType<typeof vi.fn>;
                    };
                }
            ).inlineView.mandalaSetViewData,
        ).toHaveBeenCalledWith('## 2026-02-10 二\n', true);
        expect(editorApi.setCursor).toHaveBeenCalledWith({ line: 1, ch: 0 });
    });

    it('places the first day-plan edit cursor at the body end when body text already exists', () => {
        const view = createTestView();
        view.getMandalaSceneKey = () => ({
            viewKind: '3x3',
            variant: 'day-plan',
        });
        view.documentStore.getValue = () => ({
            document: {
                content: {
                    'node-1': { content: '## 2026-02-10 二\n正文\n' },
                    'node-2': { content: 'second' },
                },
            },
        });

        const editor = new InlineEditor(view as never);
        const editorApi = attachEditorInternals(
            editor,
            '## 2026-02-10 二\n正文\n',
        );
        const target = createMockElement();

        editor.loadNode(target as unknown as HTMLElement, 'node-1');

        expect(editorApi.setCursor).toHaveBeenCalledWith({ line: 1, ch: 2 });
    });

    it('keeps restoring the historical cursor for day-plan nodes', () => {
        const view = createTestView();
        view.getMandalaSceneKey = () => ({
            viewKind: '3x3',
            variant: 'day-plan',
        });
        view.documentStore.getValue = () => ({
            document: {
                content: {
                    'node-1': { content: '## 2026-02-10 二\n正文' },
                    'node-2': { content: 'second' },
                },
            },
        });

        const editor = new InlineEditor(view as never);
        const editorApi = attachEditorInternals(
            editor,
            '## 2026-02-10 二\n正文',
        );
        const target = createMockElement();

        editor.setNodeCursor('node-1', { line: 1, ch: 2 });
        editor.loadNode(target as unknown as HTMLElement, 'node-1');

        expect(editorApi.setCursor).toHaveBeenCalledWith({ line: 1, ch: 2 });
    });

    it('cancels session on discard unload and commits unload reason otherwise', () => {
        const view = createTestView();
        const editor = new InlineEditor(view as never);
        attachEditorInternals(editor, 'dirty');
        const target = createMockElement();
        (editor as unknown as { target: MockElement | null }).target = target;

        editor.nodeId = 'node-1';
        editor.unloadNode(undefined, true);
        expect(view.editSession.cancel).toHaveBeenCalledTimes(1);
        expect(view.editSession.endSession).not.toHaveBeenCalled();

        (editor as unknown as { target: MockElement | null }).target =
            createMockElement();
        editor.nodeId = 'node-1';
        editor.unloadNodeWithReason(undefined, false, 'unload');

        expect(view.editSession.updateBuffer).toHaveBeenCalledWith('dirty');
        expect(view.editSession.endSession).toHaveBeenCalledWith('unload');
    });
});
