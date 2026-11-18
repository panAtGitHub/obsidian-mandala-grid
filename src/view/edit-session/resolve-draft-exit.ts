import { Modal, Setting } from 'obsidian';
import type { MandalaView } from 'src/view/view';
import { get } from 'svelte/store';
import {
    saveNodeContent,
    closeNodeEditor,
} from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/save-node-content';

const exitRequests = new WeakMap<MandalaView, Promise<boolean>>();

type DraftChoice = 'save' | 'discard' | 'continue';

const askDraftChoice = (view: MandalaView, closing: boolean) =>
    new Promise<DraftChoice>((resolve) => {
        const modal = new Modal(view.app);
        let choice: DraftChoice = 'continue';
        modal.setTitle('当前格子有未保存的内容');
        new Setting(modal.contentEl)
            .addButton((button) =>
                button
                    .setButtonText('保存')
                    .setCta()
                    .onClick(() => {
                        choice = 'save';
                        modal.close();
                    }),
            )
            .addButton((button) =>
                button.setButtonText('丢弃').onClick(() => {
                    choice = 'discard';
                    modal.close();
                }),
            )
            .addButton((button) => {
                if (closing) {
                    button.setButtonText('保留为草稿备份');
                    button.onClick(() => {
                        choice = 'continue';
                        modal.close();
                    });
                } else {
                    button
                        .setButtonText('继续编辑')
                        .onClick(() => modal.close());
                }
            });
        modal.onClose = () => resolve(choice);
        modal.open();
    });

const resolveExit = async (view: MandalaView, closing = false) => {
    const editor = view.inlineEditor;
    if (!editor?.nodeId) {
        closeNodeEditor(view);
        return true;
    }
    await view.editSession.waitForSave();
    if (!editor.nodeId) return true;
    const nodeId = editor.nodeId;
    view.editSession.updateBuffer(editor.getContent());
    if (!get(view.editSession.stateStore).dirty) {
        closeNodeEditor(view);
        return true;
    }

    const choice = await askDraftChoice(view, closing);
    if (editor.nodeId !== nodeId) return false;
    if (choice === 'save') {
        if (await saveNodeContent(view)) return true;
        if (!closing) return false;
        await view.preserveActiveEditorBeforeReload();
    } else if (choice === 'continue') {
        if (!closing) return false;
        await view.preserveActiveEditorBeforeReload();
    }
    closeNodeEditor(view);
    return true;
};

export const resolveDraftExit = (view: MandalaView, closing = false) => {
    const existing = exitRequests.get(view);
    if (existing) return existing;
    const request = resolveExit(view, closing).finally(() =>
        exitRequests.delete(view),
    );
    exitRequests.set(view, request);
    return request;
};
