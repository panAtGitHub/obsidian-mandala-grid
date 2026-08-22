import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    cleanupSectionSessionFolder,
    deleteSectionSessionTempFile,
    getSectionContentBySection,
    applySectionPatch,
    loggerErrorMock,
    setViewTypeMock,
    getLeafOfFileMock,
} = vi.hoisted(() => ({
    cleanupSectionSessionFolder: vi.fn(async () => {}),
    deleteSectionSessionTempFile: vi.fn(async () => {}),
    getSectionContentBySection: vi.fn(),
    applySectionPatch: vi.fn(),
    loggerErrorMock: vi.fn(),
    setViewTypeMock: vi.fn(),
    getLeafOfFileMock: vi.fn(),
}));

vi.mock('obsidian', () => {
    class MarkdownView {
        editor: {
            setCursor: ReturnType<typeof vi.fn>;
            scrollIntoView: ReturnType<typeof vi.fn>;
            focus: ReturnType<typeof vi.fn>;
            getCursor: ReturnType<typeof vi.fn>;
            getValue: ReturnType<typeof vi.fn>;
            lastLine: ReturnType<typeof vi.fn>;
            getLine: ReturnType<typeof vi.fn>;
        };
        containerEl: {
            querySelector: ReturnType<typeof vi.fn>;
        };

        constructor() {
            this.editor = {
                setCursor: vi.fn(),
                scrollIntoView: vi.fn(),
                focus: vi.fn(),
                getCursor: vi.fn(),
                getValue: vi.fn(),
                lastLine: vi.fn(),
                getLine: vi.fn(),
            };
            this.containerEl = {
                querySelector: vi.fn(() => null),
            };
        }

        getMode() {
            return 'source';
        }

        async setState() {}
    }

    return {
        MarkdownView,
        Notice: class {},
        TFile: class TFile {
            path = '';
        },
    };
});

vi.mock(
    'src/obsidian/helpers/inline-editor/cleanup-section-session-folder',
    () => ({
        cleanupSectionSessionFolder,
    }),
);
vi.mock(
    'src/obsidian/helpers/inline-editor/delete-section-session-temp-file',
    () => ({
        deleteSectionSessionTempFile,
    }),
);
vi.mock('src/mandala-display/logic/apply-section-patch', () => ({
    getSectionContentBySection,
    applySectionPatch,
}));
vi.mock('src/shared/helpers/logger', () => ({
    logger: {
        warn: vi.fn(),
        error: loggerErrorMock,
    },
}));
vi.mock('src/mandala-settings/state/actions/set-view-type', () => ({
    setViewType: setViewTypeMock,
}));
vi.mock('src/obsidian/events/workspace/helpers/get-leaf-of-file', () => ({
    getLeafOfFile: getLeafOfFileMock,
}));
vi.mock('src/view/view', () => ({
    MANDALA_VIEW_TYPE: 'mandala-grid',
}));

import { MarkdownView, TFile } from 'obsidian';
import { startSectionNativeEditorSession } from 'src/obsidian/helpers/inline-editor/section-native-editor-session';

const createMarkdownViewMock = () =>
    new (MarkdownView as unknown as { new (): MarkdownView })();

const createTFileMock = (path: string) => {
    const file = new (TFile as unknown as { new (): TFile })();
    Object.assign(file, { path });
    return file;
};

let viewSequence = 0;

const createView = ({
    sectionContent,
    variant = 'default',
}: {
    sectionContent: string;
    variant?: 'default' | 'day-plan';
}) => {
    const markdownView = createMarkdownViewMock();
    const sourceFile = createTFileMock(`daily-${++viewSequence}.md`);
    const createdFiles = new Map<string, TFile>();
    const createdContents = new Map<string, string>();
    const saveCallbacks: Array<() => unknown> = [];
    let editorValue = sectionContent;
    let editorCursor = { line: 0, ch: 0 };
    const readMock = vi.fn(async (file: TFile) => {
        if (file.path === sourceFile.path) {
            return 'source markdown';
        }
        return createdContents.get(file.path) ?? sectionContent;
    });
    const createFolderMock = vi.fn(async () => {});
    const createFileMock = vi.fn(async (path: string, content: string) => {
        const file = createTFileMock(path);
        createdFiles.set(path, file);
        createdContents.set(path, content);
        getSectionContentBySection.mockReturnValue(sectionContent);
        return file;
    });
    const getAbstractFileByPathMock = vi.fn((path: string) => {
        if (path === sourceFile.path) return sourceFile;
        return createdFiles.get(path) ?? null;
    });
    const listMock = vi.fn(async () => ({ files: [], folders: [] }));
    const rmdirMock = vi.fn(async () => {});
    const setCursorMock = vi.fn((cursor: { line: number; ch: number }) => {
        const lines = editorValue.split('\n');
        const line = lines[cursor.line];
        if (line === undefined || cursor.ch < 0 || cursor.ch > line.length) {
            throw new Error(`cursor out of range: ${JSON.stringify(cursor)}`);
        }
        editorCursor = cursor;
    });
    const focusMock = vi.fn();
    const modifyMock = vi.fn(async () => {});
    const openFileMock = vi.fn(async (file: TFile) => {
        Object.assign(markdownView, { file });
        editorValue = createdContents.get(file.path) ?? editorValue;
    });
    const setViewStateMock = vi.fn(async () => {});
    const setActiveLeafMock = vi.fn();
    const detachMock = vi.fn();
    markdownView.editor.setCursor = setCursorMock;
    markdownView.editor.focus = focusMock;
    markdownView.editor.getCursor = vi.fn(() => editorCursor);
    markdownView.editor.getValue = vi.fn(() => editorValue);
    markdownView.editor.lastLine = vi.fn(
        () => editorValue.split('\n').length - 1,
    );
    markdownView.editor.getLine = vi.fn(
        (line: number) => editorValue.split('\n')[line] ?? '',
    );
    Object.assign(markdownView.containerEl, {
        querySelector: vi.fn((selector: string) =>
            selector === '.view-actions'
                ? { querySelector: vi.fn(() => null) }
                : null,
        ),
    });
    Object.assign(markdownView, {
        addAction: vi.fn(
            (_icon: string, _title: string, callback: () => unknown) => {
                saveCallbacks.push(callback);
                return { setAttr: vi.fn() };
            },
        ),
    });
    const vault = {
        read: readMock,
        modify: modifyMock,
        createFolder: createFolderMock,
        create: createFileMock,
        getAbstractFileByPath: getAbstractFileByPathMock,
        adapter: {
            list: listMock,
            rmdir: rmdirMock,
        },
    };

    return {
        markdownView,
        createFileMock,
        sourceFile,
        setCursorMock,
        focusMock,
        setEditorValue: (value: string) => {
            editorValue = value;
        },
        vault,
        view: {
            file: sourceFile,
            app: {
                vault,
                workspace: {
                    getLeavesOfType: vi.fn(() => []),
                    on: vi.fn(() => () => {}),
                    setActiveLeaf: setActiveLeafMock,
                },
            },
            plugin: {
                registerEvent: vi.fn(),
            },
            leaf: {
                view: markdownView,
                openFile: openFileMock,
                setViewState: setViewStateMock,
                detach: detachMock,
            },
            documentStore: {
                getValue: () => ({
                    sections: {
                        id_section: {
                            'node-1': '1.1',
                        },
                    },
                }),
            },
            getMandalaSceneKey: () => ({
                viewKind: '3x3',
                variant,
            }),
        },
        saveCallbacks,
        openFileMock,
        setActiveLeafMock,
        setViewStateMock,
        modifyMock,
        detachMock,
    };
};

describe('section-native-editor-session initial cursor placement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getSectionContentBySection.mockReset();
        applySectionPatch.mockReset();
        getLeafOfFileMock.mockReset();
    });

    it('places the first day-plan edit cursor below the heading when only a heading exists', async () => {
        const sectionContent = '### 09-12';
        getSectionContentBySection.mockReturnValue(sectionContent);
        const { createFileMock, setCursorMock, view } = createView({
            sectionContent,
            variant: 'day-plan',
        });

        await startSectionNativeEditorSession(view as never, 'node-1');

        expect(createFileMock).toHaveBeenCalledWith(
            expect.stringContaining('Mandala Grid Section Edit Sessions/'),
            '### 09-12\n\u200b',
        );
        expect(setCursorMock).toHaveBeenCalledWith({ line: 1, ch: 0 });
    });

    it('hands native editor focus over once after opening in source mode', async () => {
        const sectionContent = '### 习惯打卡';
        getSectionContentBySection.mockReturnValue(sectionContent);
        const { focusMock, openFileMock, view } = createView({
            sectionContent,
            variant: 'day-plan',
        });

        await startSectionNativeEditorSession(view as never, 'node-1');

        expect(openFileMock).toHaveBeenCalledWith(expect.any(TFile), {
            active: true,
            state: { mode: 'source', source: true },
            eState: { line: 1 },
        });
        expect(focusMock).toHaveBeenCalledTimes(1);
        expect(openFileMock.mock.invocationCallOrder[0]).toBeLessThan(
            focusMock.mock.invocationCallOrder[0],
        );
    });

    it('removes the native body anchor before saving day-plan text', async () => {
        const sectionContent = '### 习惯打卡';
        getSectionContentBySection.mockReturnValue(sectionContent);
        applySectionPatch.mockReturnValue({
            markdown: 'patched markdown',
            lineForJump: 7,
        });
        const { markdownView, saveCallbacks, setEditorValue, view } =
            createView({ sectionContent, variant: 'day-plan' });

        await startSectionNativeEditorSession(view as never, 'node-1');
        setEditorValue('### 习惯打卡\n任务\u200b');
        markdownView.editor.setCursor({ line: 1, ch: 2 });
        saveCallbacks[0]?.();

        await vi.waitFor(() => {
            expect(applySectionPatch).toHaveBeenCalledWith(
                'source markdown',
                '1.1',
                '### 习惯打卡\n任务',
            );
        });
    });

    it('keeps an untouched anchored day-plan section byte-for-byte unchanged', async () => {
        const sectionContent = '### 习惯打卡';
        getSectionContentBySection.mockReturnValue(sectionContent);
        applySectionPatch.mockReturnValue({
            markdown: 'patched markdown',
            lineForJump: 7,
        });
        const { saveCallbacks, view } = createView({
            sectionContent,
            variant: 'day-plan',
        });

        await startSectionNativeEditorSession(view as never, 'node-1');
        saveCallbacks[0]?.();

        await vi.waitFor(() => {
            expect(applySectionPatch).toHaveBeenCalledWith(
                'source markdown',
                '1.1',
                sectionContent,
            );
        });
    });

    it('places the first day-plan native editor cursor at the body end when body text already exists', async () => {
        const sectionContent = '### 09-12\n正文\n';
        getSectionContentBySection.mockReturnValue(sectionContent);
        const { createFileMock, setCursorMock, view } = createView({
            sectionContent,
            variant: 'day-plan',
        });

        await startSectionNativeEditorSession(view as never, 'node-1');

        expect(createFileMock).toHaveBeenCalledWith(
            expect.stringContaining('Mandala Grid Section Edit Sessions/'),
            '### 09-12\n正文\n',
        );
        expect(setCursorMock).toHaveBeenCalledWith({ line: 1, ch: 2 });
    });

    it('keeps the non-day-plan native editor cursor at content end', async () => {
        const sectionContent = 'plain body';
        getSectionContentBySection.mockReturnValue(sectionContent);
        const { createFileMock, setCursorMock, view } = createView({
            sectionContent,
            variant: 'default',
        });

        await startSectionNativeEditorSession(view as never, 'node-1');

        expect(createFileMock).toHaveBeenCalledWith(
            expect.stringContaining('Mandala Grid Section Edit Sessions/'),
            'plain body',
        );
        expect(setCursorMock).toHaveBeenCalledWith({
            line: 0,
            ch: 'plain body'.length,
        });
    });

    it('returns to Mandala with one active file switch before cleanup', async () => {
        const sectionContent = 'plain body';
        getSectionContentBySection.mockReturnValue(sectionContent);
        applySectionPatch.mockReturnValue({
            markdown: 'patched markdown',
            lineForJump: 7,
        });
        const {
            view,
            sourceFile,
            saveCallbacks,
            openFileMock,
            setActiveLeafMock,
            setViewStateMock,
            modifyMock,
        } = createView({ sectionContent });

        await startSectionNativeEditorSession(view as never, 'node-1');
        const cleanupCallsBeforeSave =
            deleteSectionSessionTempFile.mock.calls.length;

        saveCallbacks[0]?.();

        await vi.waitFor(() => {
            expect(modifyMock).toHaveBeenCalledWith(
                sourceFile,
                'patched markdown',
            );
        });
        await vi.waitFor(() => {
            expect(
                deleteSectionSessionTempFile.mock.calls.length,
            ).toBeGreaterThan(cleanupCallsBeforeSave);
        });

        expect(openFileMock).toHaveBeenCalledTimes(2);
        expect(openFileMock).toHaveBeenLastCalledWith(sourceFile, {
            active: true,
            eState: { line: 7 },
        });
        expect(setViewStateMock).not.toHaveBeenCalled();
        expect(setActiveLeafMock).not.toHaveBeenCalled();
        expect(setViewTypeMock).toHaveBeenCalledWith(
            view.plugin,
            sourceFile.path,
            'mandala-grid',
        );
    });

    it('returns to the existing Mandala leaf and closes the temporary editor leaf', async () => {
        const sectionContent = 'plain body';
        getSectionContentBySection.mockReturnValue(sectionContent);
        applySectionPatch.mockReturnValue({
            markdown: 'patched markdown',
            lineForJump: 7,
        });
        const {
            view,
            saveCallbacks,
            openFileMock,
            setActiveLeafMock,
            detachMock,
        } = createView({ sectionContent });
        const sourceLeaf = {
            setEphemeralState: vi.fn(),
        };
        getLeafOfFileMock.mockReturnValue(sourceLeaf);

        await startSectionNativeEditorSession(view as never, 'node-1');
        const cleanupCallsBeforeSave =
            deleteSectionSessionTempFile.mock.calls.length;

        saveCallbacks[0]?.();

        await vi.waitFor(() => {
            expect(
                deleteSectionSessionTempFile.mock.calls.length,
            ).toBeGreaterThan(cleanupCallsBeforeSave);
        });

        expect(openFileMock).toHaveBeenCalledTimes(1);
        expect(setActiveLeafMock).toHaveBeenCalledWith(sourceLeaf);
        expect(sourceLeaf.setEphemeralState).toHaveBeenCalledWith({ line: 7 });
        expect(detachMock).toHaveBeenCalledTimes(1);
    });

    it('reports a return failure and keeps the temporary session for retry', async () => {
        const sectionContent = 'plain body';
        getSectionContentBySection.mockReturnValue(sectionContent);
        applySectionPatch.mockReturnValue({
            markdown: 'patched markdown',
            lineForJump: 7,
        });
        const { view, saveCallbacks, openFileMock } = createView({
            sectionContent,
        });

        await startSectionNativeEditorSession(view as never, 'node-1');
        const cleanupCallsBeforeSave =
            deleteSectionSessionTempFile.mock.calls.length;
        openFileMock.mockImplementationOnce(async () => {
            throw new Error('return failed');
        });

        saveCallbacks[0]?.();

        await vi.waitFor(() => {
            expect(loggerErrorMock).toHaveBeenCalledWith(
                '[mandala-section-edit] save failed',
                expect.any(Error),
            );
        });
        expect(deleteSectionSessionTempFile.mock.calls.length).toBe(
            cleanupCallsBeforeSave,
        );
    });
});
