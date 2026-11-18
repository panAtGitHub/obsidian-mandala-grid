import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditSessionService } from './edit-session-service';
import { resolveDraftExit } from './resolve-draft-exit';

const buttons = vi.hoisted(() => new Map<string, () => void>());
vi.mock('obsidian', () => {
    class Modal {
        contentEl = {};
        onClose = () => {};
        setTitle() {}
        open() {}
        close() {
            this.onClose();
        }
    }
    class Setting {
        addButton(build: (button: unknown) => unknown) {
            let text = '';
            const button = {
                setButtonText: (label: string) => {
                    text = label;
                    return button;
                },
                setCta: () => button,
                onClick: (click: () => void) => buttons.set(text, click),
            };
            build(button);
            return this;
        }
    }
    return { Modal, Setting };
});

const createDraft = (saveSucceeds = true) => {
    const session = new EditSessionService(() => saveSucceeds);
    session.startSession('node', false, 'original');
    const editor = {
        nodeId: 'node',
        getContent: () => 'draft',
        requestSave: vi.fn(() => session.requestSave()),
        unloadNode: vi.fn(() => session.endSession()),
    };
    const dispatch = vi.fn();
    const preserveActiveEditorBeforeReload = vi.fn(async () => true);
    const view = {
        inlineEditor: editor,
        editSession: session,
        viewStore: {
            dispatch,
            getValue: () => ({
                document: {
                    editing: { activeNodeId: 'node', isInSidebar: false },
                },
            }),
        },
        preserveActiveEditorBeforeReload,
    };
    return { view, editor, dispatch, preserveActiveEditorBeforeReload };
};

describe('resolveDraftExit', () => {
    afterEach(() => buttons.clear());

    it('keeps the draft on continue and does not write it on discard', async () => {
        const { view, editor, dispatch } = createDraft();
        const stay = resolveDraftExit(view as never);
        await Promise.resolve();
        buttons.get('继续编辑')?.();
        await expect(stay).resolves.toBe(false);
        expect(dispatch).not.toHaveBeenCalled();
        const discard = resolveDraftExit(view as never);
        await Promise.resolve();
        buttons.get('丢弃')?.();
        await expect(discard).resolves.toBe(true);
        expect(editor.requestSave).not.toHaveBeenCalled();
        expect(editor.unloadNode).toHaveBeenCalledOnce();
    });

    it('leaves editing open after a failed save, and preserves a copy when the host is closing', async () => {
        const { view, editor, preserveActiveEditorBeforeReload } =
            createDraft(false);
        const stay = resolveDraftExit(view as never);
        await Promise.resolve();
        buttons.get('保存')?.();
        await expect(stay).resolves.toBe(false);
        expect(editor.unloadNode).not.toHaveBeenCalled();
        const closing = resolveDraftExit(view as never, true);
        await Promise.resolve();
        buttons.get('保留为草稿备份')?.();
        await expect(closing).resolves.toBe(true);
        expect(preserveActiveEditorBeforeReload).toHaveBeenCalledOnce();
        expect(editor.unloadNode).toHaveBeenCalledOnce();
    });
});
