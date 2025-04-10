import { Editor, EditorPosition, MarkdownView, TFile } from 'obsidian';
import { LineageView } from 'src/view/view';
import { AdjustHeight } from 'src/view/actions/inline-editor/expandable-textarea-action';
import { vimEnterInsertMode } from 'src/obsidian/helpers/inline-editor/helpers/vim-enter-insert-mode';
import { fixVimCursorWhenZooming } from 'src/obsidian/helpers/inline-editor/helpers/fix-vim-cursor-when-zooming';
import { lockFile } from 'src/obsidian/helpers/inline-editor/helpers/lock-file';
import { unlockFile } from 'src/obsidian/helpers/inline-editor/helpers/unlock-file';

const noop = async () => {};

export type InlineMarkdownView = MarkdownView & {
    __setViewData__: MarkdownView['setViewData'];
};

export class InlineEditor {
    private inlineView: InlineMarkdownView;
    private containerEl: HTMLElement;
    #nodeId: string | null = null;
    target: HTMLElement | null = null;
    private onChangeSubscriptions: Set<() => void> = new Set();
    #mounting: Promise<void> = Promise.resolve();
    private subscriptions: Set<() => void> = new Set();
    private cursorPositions: Map<string, EditorPosition> = new Map();

    constructor(private view: LineageView) {}

    get nodeId() {
        return this.#nodeId;
    }
    set nodeId(value: string | null) {
        this.#nodeId = value;
    }

    get mounting() {
        return this.#mounting;
    }

    getContent() {
        return this.inlineView.editor.getValue();
    }

    getCursor() {
        return this.inlineView.editor.getCursor();
    }

    getEditor(): Editor {
        return this.inlineView.editor;
    }

    deleteNodeCursor(nodeId: string) {
        this.cursorPositions.delete(nodeId);
    }
    setNodeCursor(nodeId: string, cursor: EditorPosition) {
        if (this.nodeId && nodeId === this.nodeId) this.setCursor(cursor);
        else this.cursorPositions.set(nodeId, cursor);
    }

    setContent(content: string) {
        this.inlineView.__setViewData__(content, true);
    }

    loadNode(target: HTMLElement, nodeId: string) {
        if (!this.view.file) return;
        if (this.nodeId) {
            this.unloadNode();
        }

        let resolve = () => {};
        this.#mounting = new Promise((_resolve) => {
            resolve = _resolve;
        });

        const content =
            this.view.documentStore.getValue().document.content[nodeId]
                ?.content;
        this.setContent(content);

        target.append(this.containerEl);
        this.focus();
        AdjustHeight(this.view, target)();
        this.target = target;
        if (!content) {
            vimEnterInsertMode(this.view.plugin, this.inlineView);
        }
        this.target.addEventListener('focusin', this.setActiveEditor);
        this.setActiveEditor();

        this.nodeId = nodeId;
        this.restoreCursor();
        this.lockFile();
        this.fixVimWhenZooming();
        setTimeout(() => resolve(), Math.max(16, content.length / 60));
    }

    focus = () => {
        this.inlineView.editor.focus();
    };

    isCursorInRange = (cursor: EditorPosition): boolean => {
        const docStart = { line: 0, ch: 0 };
        const lastLine = this.inlineView.editor.lastLine();
        const docEnd = {
            line: lastLine,
            ch: this.inlineView.editor.getLine(lastLine).length,
        };

        const isLineInRange =
            cursor.line >= docStart.line && cursor.line <= docEnd.line;
        const isChInRange =
            (cursor.line === docStart.line ? cursor.ch >= docStart.ch : true) &&
            (cursor.line === docEnd.line ? cursor.ch <= docEnd.ch : true);

        return isLineInRange && isChInRange;
    };
    restoreCursor = () => {
        const existingCursor = this.cursorPositions.get(this.nodeId!);
        if (existingCursor && this.isCursorInRange(existingCursor)) {
            this.setCursor(existingCursor);
        } else {
            const lastLine = this.inlineView.editor.lastLine();
            const ch = this.inlineView.editor.getLine(lastLine).length;
            this.setCursor({
                line: lastLine,
                ch: ch,
            });
        }
    };

    unloadNode(nodeId?: string, discardChanges = false) {
        const currentNodeId = this.nodeId;
        if (nodeId && nodeId !== currentNodeId) return;
        if (currentNodeId && !discardChanges) {
            this.saveContent();
            const cursor = this.getCursor();
            this.cursorPositions.set(currentNodeId, cursor);
        }
        this.nodeId = null;
        if (this.target) {
            this.view.plugin.app.workspace.activeEditor = null;
            this.target.removeEventListener('focusin', this.setActiveEditor);
            this.target.empty();
            this.target = null;
        }
        for (const subscription of this.subscriptions) {
            subscription();
            this.subscriptions.delete(subscription);
        }
        this.unlockFile();
    }

    async onload() {
        const workspace = this.view.plugin.app.workspace;

        this.containerEl = document.createElement('div');
        this.containerEl.addClasses(['lineage-inline-editor']);
        this.inlineView = new MarkdownView({
            containerEl: this.containerEl,
            app: this.view.plugin.app,
            workspace,
        } as never) as InlineMarkdownView;
        this.inlineView.save = noop;
        this.inlineView.requestSave = this.invokeAndDeleteOnChangeSubscriptions;
        this.inlineView.__setViewData__ = this.inlineView.setViewData;
        this.inlineView.setViewData = noop;

        if (this.inlineView.getMode() === 'preview') {
            await this.inlineView.setState(
                { mode: 'source' },
                { history: false },
            );
        }
    }

    onNextChange(subscription: () => void) {
        this.onChangeSubscriptions.add(subscription);
        return () => {
            this.onChangeSubscriptions.delete(subscription);
        };
    }

    async loadFile(file: TFile) {
        this.inlineView.file = file;
        await this.inlineView.onLoadFile(file);
    }

    async unloadFile() {
        const file = this.inlineView.file;
        if (file) {
            this.inlineView.file = null;
            await this.inlineView.onUnloadFile(file);
        }
        this.unloadNode();
    }

    private setActiveEditor = () => {
        // @ts-ignore
        this.view.plugin.app.workspace._activeEditor = this.inlineView;
    };

    private invokeAndDeleteOnChangeSubscriptions = () => {
        if (this.onChangeSubscriptions.size > 0)
            for (const subscription of this.onChangeSubscriptions) {
                subscription();
                this.onChangeSubscriptions.delete(subscription);
            }
    };

    private setCursor(cursor: EditorPosition) {
        this.inlineView.editor.setCursor(cursor);
    }

    /* prevents obsidian from replacing file.data with card.data when the card editor and file editor share the same file*/
    private lockFile() {
        lockFile(this.view);
    }

    private unlockFile() {
        unlockFile(this.view);
    }

    private saveContent = () => {
        const nodeId = this.nodeId;
        if (!nodeId) return;
        const content = this.getContent();
        const viewState = this.view.viewStore.getValue();
        this.view.documentStore.dispatch({
            type: 'document/update-node-content',
            payload: {
                nodeId: nodeId,
                content: content,
            },
            context: {
                isInSidebar: viewState.document.editing.isInSidebar,
            },
        });
    };

    fixVimWhenZooming = () => {
        const viewState = this.view.viewStore.getValue();
        if (viewState.document.editing.isInSidebar) return;

        const unsub = fixVimCursorWhenZooming(this.view);
        if (unsub) {
            this.subscriptions.add(unsub);
        }
    };
}
