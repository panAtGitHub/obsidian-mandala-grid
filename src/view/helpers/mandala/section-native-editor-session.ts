import { MarkdownView, Notice, TFile, ViewState } from 'obsidian';
import { logger } from 'src/helpers/logger';
import { parseHtmlCommentMarker } from 'src/lib/data-conversion/helpers/html-comment-marker/parse-html-comment-marker';
import { setViewType } from 'src/stores/settings/actions/set-view-type';
import { MANDALA_VIEW_TYPE, type MandalaView } from 'src/view/view';
import {
    applySectionPatch,
    getSectionContentBySection,
} from 'src/view/helpers/mandala/apply-section-patch';

type SectionEditSession = {
    tempFilePath: string;
    sourceFilePath: string;
    section: string;
};

const sessionByTempFilePath = new Map<string, SectionEditSession>();

const ACTION_SAVE_ID = 'mandala-section-edit-save';
const ACTION_CANCEL_ID = 'mandala-section-edit-cancel';

const ensureFolderRecursive = async (view: MandalaView, path: string) => {
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
        current = current ? `${current}/${part}` : part;
        if (view.app.vault.getAbstractFileByPath(current)) continue;
        await view.app.vault.createFolder(current);
    }
};

const getSectionByNodeId = (view: MandalaView, nodeId: string): string | null =>
    view.documentStore.getValue().sections.id_section[nodeId] ?? null;

const findSectionMarkerLine = (markdown: string, section: string) => {
    const lines = markdown.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const marker = parseHtmlCommentMarker(lines[i]);
        if (marker && marker[2] === section) return i;
    }
    return 0;
};

const getFileByPath = (view: MandalaView, path: string): TFile | null => {
    const file = view.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
};

const getMarkdownView = (view: MandalaView) =>
    view.leaf.view instanceof MarkdownView ? view.leaf.view : null;

const wait = (ms: number) =>
    new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const centerCursorLineInEditor = (markdownView: MarkdownView) => {
    const scroller = markdownView.containerEl.querySelector<HTMLElement>(
        '.cm-editor .cm-scroller',
    );
    const activeLine = markdownView.containerEl.querySelector<HTMLElement>(
        '.cm-editor .cm-activeLine',
    );
    if (!scroller || !activeLine) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    const scrollerMidY = scrollerRect.top + scrollerRect.height / 2;
    const lineMidY = lineRect.top + lineRect.height / 2;
    scroller.scrollTop += lineMidY - scrollerMidY;
};

const setCursorToContentEnd = (markdownView: MarkdownView) => {
    const line = markdownView.editor.lastLine();
    const ch = markdownView.editor.getLine(line).length;
    const target = { line, ch };
    markdownView.editor.setCursor(target);
    markdownView.editor.scrollIntoView({ from: target, to: target }, true);
    markdownView.editor.focus();
    const recenter = () => {
        markdownView.editor.scrollIntoView({ from: target, to: target }, true);
        centerCursorLineInEditor(markdownView);
    };
    window.requestAnimationFrame(recenter);
    window.setTimeout(recenter, 80);
    window.setTimeout(recenter, 220);
};

const switchBackToMandala = async (
    view: MandalaView,
    sourceFile: TFile,
    line: number,
) => {
    await view.leaf.openFile(sourceFile);
    await view.leaf.setViewState(
        {
            type: MANDALA_VIEW_TYPE,
            popstate: true,
            state: view.leaf.view.getState(),
        } as ViewState,
        { line },
    );
    setViewType(view.plugin, sourceFile.path, MANDALA_VIEW_TYPE);
    view.app.workspace.setActiveLeaf(view.leaf, { focus: true });
};

const cleanupSession = async (view: MandalaView, tempFilePath: string) => {
    sessionByTempFilePath.delete(tempFilePath);
    const tempFile = getFileByPath(view, tempFilePath);
    if (!tempFile) return;
    await view.app.fileManager.trashFile(tempFile);
};

const withSessionFromView = (
    view: MandalaView,
): { session: SectionEditSession; markdownView: MarkdownView } | null => {
    const markdownView = getMarkdownView(view);
    const tempFilePath = markdownView?.file?.path;
    if (!markdownView || !tempFilePath) return null;
    const session = sessionByTempFilePath.get(tempFilePath);
    if (!session) return null;
    return { session, markdownView };
};

const saveSectionAndReturn = async (view: MandalaView) => {
    const ctx = withSessionFromView(view);
    if (!ctx) return;
    const { session } = ctx;
    const sourceFile = getFileByPath(view, session.sourceFilePath);
    const tempFile = getFileByPath(view, session.tempFilePath);
    if (!sourceFile || !tempFile) {
        new Notice('源文件或临时编辑文件不存在，无法保存。');
        return;
    }

    const [sourceMarkdown, replacement] = await Promise.all([
        view.app.vault.read(sourceFile),
        view.app.vault.read(tempFile),
    ]);
    const patched = applySectionPatch(sourceMarkdown, session.section, replacement);
    if (!patched) {
        new Notice('未找到对应 section，保存失败。');
        return;
    }
    await view.app.vault.modify(sourceFile, patched.markdown);
    await switchBackToMandala(view, sourceFile, patched.lineForJump);
    await cleanupSession(view, session.tempFilePath);
};

const cancelSectionEditAndReturn = async (view: MandalaView) => {
    const ctx = withSessionFromView(view);
    if (!ctx) return;
    const { session } = ctx;
    const sourceFile = getFileByPath(view, session.sourceFilePath);
    if (!sourceFile) {
        new Notice('源文件不存在，无法返回九宫视图。');
        return;
    }
    const sourceMarkdown = await view.app.vault.read(sourceFile);
    const line = findSectionMarkerLine(sourceMarkdown, session.section);
    await switchBackToMandala(view, sourceFile, line);
    await cleanupSession(view, session.tempFilePath);
};

const addSectionEditorActions = (view: MandalaView, markdownView: MarkdownView) => {
    const actions = markdownView.containerEl.querySelector('.view-actions');
    if (!actions) return;
    if (actions.querySelector(`[data-mandala-action="${ACTION_SAVE_ID}"]`)) {
        return;
    }
    const itemView = markdownView as unknown as {
        addAction?: (
            icon: string,
            title: string,
            callback: (evt: MouseEvent) => unknown,
        ) => HTMLElement;
    };
    if (typeof itemView.addAction !== 'function') return;

    const saveEl = itemView.addAction('save', '保存并返回九宫', () => {
        void saveSectionAndReturn(view);
    });
    saveEl.setAttr('data-mandala-action', ACTION_SAVE_ID);

    const cancelEl = itemView.addAction('x', '取消并返回九宫', () => {
        void cancelSectionEditAndReturn(view);
    });
    cancelEl.setAttr('data-mandala-action', ACTION_CANCEL_ID);
};

export const startSectionNativeEditorSession = async (
    view: MandalaView,
    nodeId: string,
) => {
    try {
        const sourceFile = view.file;
        if (!sourceFile) return;

        const section = getSectionByNodeId(view, nodeId);
        if (!section) {
            new Notice('未找到对应 section，无法进入单独编辑。');
            return;
        }

        const sourceMarkdown = await view.app.vault.read(sourceFile);
        const sectionContent = getSectionContentBySection(sourceMarkdown, section);
        if (sectionContent === null) {
            new Notice('未找到对应 section 内容，无法进入编辑。');
            return;
        }

        const pluginId = view.plugin.manifest.id;
        const sessionFolder = `${view.app.vault.configDir}/plugins/${pluginId}/.section-edit-sessions`;
        await ensureFolderRecursive(view, sessionFolder);
        const safeSection = String(section).replace(/\./g, '-');
        const tempPath = `${sessionFolder}/${Date.now()}-${safeSection}.md`;
        const tempFile = await view.app.vault.create(tempPath, sectionContent);
        sessionByTempFilePath.set(tempPath, {
            tempFilePath: tempPath,
            sourceFilePath: sourceFile.path,
            section,
        });

        await view.leaf.openFile(tempFile);
        const markdownView = getMarkdownView(view);
        if (!markdownView) return;
        if (markdownView.getMode() === 'preview') {
            await markdownView.setState({ mode: 'source' }, { history: false });
        }
        addSectionEditorActions(view, markdownView);
        for (let attempt = 0; attempt < 10; attempt++) {
            const liveView = getMarkdownView(view);
            if (liveView?.editor) {
                setCursorToContentEnd(liveView);
                return;
            }
            await wait(24);
        }
    } catch (error) {
        new Notice('打开 section 原生编辑失败，请重试。');
        logger.error(error);
    }
};
