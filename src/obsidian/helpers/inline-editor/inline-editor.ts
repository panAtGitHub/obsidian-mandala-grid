import { Editor, EditorPosition, MarkdownView, TFile } from 'obsidian';
import {
    resolveNodeEditorCommitContent,
    resolveNodeEditorInitialPlacement,
} from 'src/mandala-interaction/helpers/resolve-node-editor-initial-placement';
import { MandalaView } from 'src/view/view';
import { vimEnterInsertMode } from 'src/obsidian/helpers/inline-editor/helpers/vim-enter-insert-mode';
import { fixVimCursorWhenZooming } from 'src/obsidian/helpers/inline-editor/helpers/fix-vim-cursor-when-zooming';
import { lockFile } from 'src/obsidian/helpers/inline-editor/helpers/lock-file';
import { unlockFile } from 'src/obsidian/helpers/inline-editor/helpers/unlock-file';

const noopSave = async function (
    this: void,
    _clear?: boolean,
): Promise<void> {};
const noopSetViewData = function (
    this: void,
    _data: string,
    _clear: boolean,
): void {};

export type InlineMarkdownView = MarkdownView & {
    mandalaSetViewData: MarkdownView['setViewData'];
};

export class InlineEditor {
    private inlineView!: InlineMarkdownView;
    private containerEl!: HTMLElement;
    #nodeId: string | null = null;
    target: HTMLElement | null = null;
    private onChangeSubscriptions: Set<() => void> = new Set();
    #mounting: Promise<void> = Promise.resolve();
    private subscriptions: Set<() => void> = new Set();
    private cursorPositions: Map<string, EditorPosition> = new Map();
    private currentInitialPlacement: {
        nodeId: string;
        originalContent: string;
        preparedContent: string;
    } | null = null;
    private suppressEditorEvents = false;
    private readyPromise: Promise<void> | null = null;
    private readyFile: TFile | null = null;
    private readyGeneration = 0;
    private pendingLoadNode: {
        target: HTMLElement;
        nodeId: string;
    } | null = null;

    constructor(private view: MandalaView) {}

    private ensureReady(file: TFile) {
        if (!this.readyPromise || this.readyFile !== file) {
            this.readyFile = file;
            const generation = ++this.readyGeneration;
            this.readyPromise = (async () => {
                await this.onload();
                if (generation !== this.readyGeneration) return;
                await this.loadFile(file);
            })();
        }
        return this.readyPromise;
    }

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
        const currentContent = this.inlineView.editor.getValue();
        const placement = this.currentInitialPlacement;
        if (!placement || placement.nodeId !== this.nodeId) {
            return currentContent;
        }
        return resolveNodeEditorCommitContent({
            currentContent,
            originalContent: placement.originalContent,
            preparedContent: placement.preparedContent,
        });
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
        this.suppressEditorEvents = true;
        try {
            this.inlineView.mandalaSetViewData(content, true);
        } finally {
            this.suppressEditorEvents = false;
        }
    }

    loadNode(target: HTMLElement, nodeId: string) {
        const file = this.view.file;
        if (!file) return;
        const inlineViewNeedsFile =
            this.inlineView &&
            'file' in (this.inlineView as unknown as Record<string, unknown>) &&
            this.inlineView.file !== file;
        if (!this.inlineView || inlineViewNeedsFile) {
            this.pendingLoadNode = { target, nodeId };
            void this.ensureReady(file).then(() => {
                if (
                    this.readyFile !== file ||
                    ('file' in
                        (this.inlineView as unknown as Record<
                            string,
                            unknown
                        >) &&
                        this.inlineView.file !== file)
                ) {
                    return;
                }
                const pending = this.pendingLoadNode;
                if (!pending) return;
                this.pendingLoadNode = null;
                this.loadNodeReady(pending.target, pending.nodeId);
            });
            return;
        }
        this.loadNodeReady(target, nodeId);
    }

    private loadNodeReady(target: HTMLElement, nodeId: string) {
        if (!this.view.file || !this.inlineView) return;
        const currentNodeId = this.nodeId;

        let resolve = () => {};
        this.#mounting = new Promise((_resolve) => {
            resolve = _resolve;
        });

        const content =
            this.view.getContentForNode?.(nodeId) ??
            this.view.documentStore.getValue().document.content[nodeId]
                ?.content ??
            '';
        const isInSidebar =
            this.view.viewStore.getValue().document.editing.isInSidebar;
        const initialPlacement = resolveNodeEditorInitialPlacement({
            content,
            isDayPlanScene:
                this.view.getMandalaSceneKey().variant === 'day-plan',
            historyCursor: this.cursorPositions.get(nodeId),
        });

        if (currentNodeId && currentNodeId !== nodeId) {
            this.view.editSession.updateBuffer(this.getContent());
            this.view.editSession.switchNode(nodeId, isInSidebar, content);
            const cursor = this.getCursor();
            this.cursorPositions.set(currentNodeId, cursor);
            this.detachTarget();
        } else if (!currentNodeId) {
            this.view.editSession.startSession(nodeId, isInSidebar, content);
        }

        this.currentInitialPlacement = {
            nodeId,
            originalContent: content,
            preparedContent: initialPlacement.content,
        };

        this.setContent(initialPlacement.content);

        target.append(this.containerEl);
        this.inlineView.editor.refresh();
        this.focus();
        this.target = target;
        if (!content) {
            vimEnterInsertMode(this.view.plugin, this.inlineView);
        }
        this.target.addEventListener('focusin', this.setActiveEditor);
        this.target.addEventListener('focusout', this.handleEditorFocusOut);
        this.setActiveEditor();

        this.nodeId = nodeId;
        this.restoreCursor();
        this.lockFile();
        this.fixVimWhenZooming();
        window.requestAnimationFrame(() => {
            if (this.target === target && this.nodeId === nodeId) {
                this.inlineView.editor.refresh();
            }
        });
        window.setTimeout(() => resolve(), Math.max(16, content.length / 60));
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
        const placement = resolveNodeEditorInitialPlacement({
            content: this.inlineView.editor.getValue(),
            isDayPlanScene:
                this.view.getMandalaSceneKey().variant === 'day-plan',
            historyCursor: this.cursorPositions.get(this.nodeId!),
        });
        if (this.isCursorInRange(placement.cursor)) {
            this.setCursor(placement.cursor);
            return;
        }

        const lastLine = this.inlineView.editor.lastLine();
        const ch = this.inlineView.editor.getLine(lastLine).length;
        this.setCursor({
            line: lastLine,
            ch,
        });
    };

    unloadNode(nodeId?: string, discardChanges = false) {
        this.unloadNodeWithReason(nodeId, discardChanges, 'disable-edit');
    }

    unloadNodeWithReason(
        nodeId: string | undefined,
        discardChanges: boolean,
        reason: 'disable-edit' | 'unload',
    ) {
        if (
            this.pendingLoadNode &&
            (!nodeId || this.pendingLoadNode.nodeId === nodeId)
        ) {
            this.pendingLoadNode = null;
        }
        const currentNodeId = this.nodeId;
        if (nodeId && nodeId !== currentNodeId) return;
        if (currentNodeId && discardChanges) {
            this.view.editSession.cancel();
        } else if (currentNodeId) {
            this.view.editSession.updateBuffer(this.getContent());
            this.view.editSession.endSession(reason);
            const cursor = this.getCursor();
            this.cursorPositions.set(currentNodeId, cursor);
        }
        this.nodeId = null;
        this.currentInitialPlacement = null;
        this.detachTarget();
        for (const subscription of this.subscriptions) {
            subscription();
            this.subscriptions.delete(subscription);
        }
        this.unlockFile();
    }

    async onload() {
        if (this.inlineView) return;
        const workspace = this.view.plugin.app.workspace;

        this.containerEl = activeDocument.createElement('div');
        this.containerEl.addClasses(['mandala-inline-editor']);
        this.inlineView = new MarkdownView({
            containerEl: this.containerEl,
            app: this.view.plugin.app,
            workspace,
            history: {
                backHistory: [],
                forwardHistory: [],
            },
        } as never) as InlineMarkdownView;
        this.inlineView.save = noopSave;
        this.inlineView.requestSave = this.handleRequestSave;
        const boundSetViewData = this.inlineView.setViewData.bind(
            this.inlineView,
        ) as MarkdownView['setViewData'];
        this.inlineView.mandalaSetViewData = boundSetViewData;
        this.inlineView.setViewData = noopSetViewData;

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
        if (!this.inlineView) return;
        this.inlineView.file = file;
        await this.inlineView.onLoadFile(file);
    }

    async unloadFile() {
        this.readyGeneration += 1;
        this.readyFile = null;
        this.readyPromise = null;
        if (!this.inlineView) {
            this.pendingLoadNode = null;
            this.unloadNode();
            return;
        }
        const file = this.inlineView.file;
        if (file) {
            this.inlineView.file = null;
            await this.inlineView.onUnloadFile(file);
        }
        this.unloadNode();
    }

    private setActiveEditor = () => {
        const workspace = this.view.plugin.app
            .workspace as typeof this.view.plugin.app.workspace & {
            _activeEditor?: InlineMarkdownView | null;
        };
        workspace.activeEditor = this.inlineView;
        workspace._activeEditor = this.inlineView;
    };

    private invokeAndDeleteOnChangeSubscriptions = () => {
        if (this.onChangeSubscriptions.size > 0)
            for (const subscription of this.onChangeSubscriptions) {
                subscription();
                this.onChangeSubscriptions.delete(subscription);
            }
    };

    private handleRequestSave = (_clear?: boolean): void => {
        if (!this.nodeId || this.suppressEditorEvents) return;
        this.view.editSession.updateBuffer(this.getContent());
        this.view.editSession.requestSave();
        this.invokeAndDeleteOnChangeSubscriptions();
    };

    private handleEditorFocusOut = (event: FocusEvent) => {
        if (!this.target || !this.nodeId) return;
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && this.target.contains(nextTarget)) return;
        this.view.editSession.updateBuffer(this.getContent());
        this.view.editSession.requestBlurCommit();
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

    requestSave() {
        if (!this.nodeId || this.suppressEditorEvents) return;
        this.view.editSession.updateBuffer(this.getContent());
        this.view.editSession.requestSave();
        this.invokeAndDeleteOnChangeSubscriptions();
    }

    private detachTarget() {
        if (!this.target) return;
        const workspace = this.view.plugin.app
            .workspace as typeof this.view.plugin.app.workspace & {
            _activeEditor?: InlineMarkdownView | null;
        };
        workspace.activeEditor = null;
        workspace._activeEditor = null;
        this.target.removeEventListener('focusin', this.setActiveEditor);
        this.target.removeEventListener('focusout', this.handleEditorFocusOut);
        this.target.empty();
        this.target = null;
    }

    fixVimWhenZooming = () => {
        const viewState = this.view.viewStore.getValue();
        if (viewState.document.editing.isInSidebar) return;

        const unsub = fixVimCursorWhenZooming(this.view);
        if (unsub) {
            this.subscriptions.add(unsub);
        }
    };
}
