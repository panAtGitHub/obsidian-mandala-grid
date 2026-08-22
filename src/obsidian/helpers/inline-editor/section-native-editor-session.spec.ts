import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    cleanupSectionSessionFolder,
    deleteSectionSessionTempFile,
    getSectionContentBySection,
    applySectionPatch,
} = vi.hoisted(() => ({
    cleanupSectionSessionFolder: vi.fn(async () => {}),
    deleteSectionSessionTempFile: vi.fn(async () => {}),
    getSectionContentBySection: vi.fn(),
    applySectionPatch: vi.fn(),
}));

vi.mock('obsidian', () => {
    class MarkdownView {
        editor: {
            setCursor: ReturnType<typeof vi.fn>;
            scrollIntoView: ReturnType<typeof vi.fn>;
            focus: ReturnType<typeof vi.fn>;
            getLine: ReturnType<typeof vi.fn>;
            lastLine: ReturnType<typeof vi.fn>;
        };
        containerEl: {
            querySelector: ReturnType<typeof vi.fn>;
        };

        constructor() {
            this.editor = {
                setCursor: vi.fn(),
                scrollIntoView: vi.fn(),
                focus: vi.fn(),
                getLine: vi.fn(() => ''),
                lastLine: vi.fn(() => 0),
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
        error: vi.fn(),
    },
}));
vi.mock('src/mandala-settings/state/actions/set-view-type', () => ({
    setViewType: vi.fn(),
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

const createView = ({
    sectionContent,
    variant = 'default',
    deferEditorTarget = false,
}: {
    sectionContent: string;
    variant?: 'default' | 'day-plan';
    deferEditorTarget?: boolean;
}) => {
    const markdownView = createMarkdownViewMock();
    const sourceFile = createTFileMock('daily.md');
    const createdFiles = new Map<string, TFile>();
    let openedContent = sectionContent;
    const editorTargetState = { ready: !deferEditorTarget };
    markdownView.editor.lastLine = vi.fn(() => {
        if (!editorTargetState.ready) return 0;
        return Math.max(0, openedContent.split(/\r?\n/).length - 1);
    });
    markdownView.editor.getLine = vi.fn((line: number) => {
        if (!editorTargetState.ready) return '';
        return openedContent.split(/\r?\n/)[line] ?? '';
    });
    const readMock = vi.fn(async (file: TFile) => {
        if (file.path === sourceFile.path) {
            return 'source markdown';
        }
        return sectionContent;
    });
    const createFolderMock = vi.fn(async () => {});
    const createFileMock = vi.fn(async (path: string, content: string) => {
        const file = createTFileMock(path);
        openedContent = content;
        createdFiles.set(path, file);
        getSectionContentBySection.mockReturnValue(sectionContent);
        readMock.mockImplementation(async (target: TFile) => {
            if (target.path === sourceFile.path) {
                return 'source markdown';
            }
            if (target.path === path) {
                return content;
            }
            return sectionContent;
        });
        return file;
    });
    const getAbstractFileByPathMock = vi.fn((path: string) => {
        if (path === sourceFile.path) return sourceFile;
        return createdFiles.get(path) ?? null;
    });
    const listMock = vi.fn(async () => ({ files: [], folders: [] }));
    const rmdirMock = vi.fn(async () => {});
    const setCursorMock = vi.fn();
    markdownView.editor.setCursor = setCursorMock;
    setCursorMock.mockImplementation(() => {
        if (!editorTargetState.ready) {
            throw new Error('cursor assigned before editor target was ready');
        }
    });
    const focusMock = vi.fn();
    markdownView.editor.focus = focusMock;
    const openFileMock = vi.fn(async (file: TFile) => {
        Object.assign(markdownView, { file });
        if (deferEditorTarget) {
            window.requestAnimationFrame(() => {
                editorTargetState.ready = true;
            });
        }
    });
    const vault = {
        read: readMock,
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
        openFileMock,
        vault,
        view: {
            file: sourceFile,
            app: {
                vault,
                workspace: {
                    getLeavesOfType: vi.fn(() => []),
                    on: vi.fn(() => () => {}),
                    setActiveLeaf: vi.fn(),
                },
            },
            plugin: {
                registerEvent: vi.fn(),
            },
            leaf: {
                view: markdownView,
                openFile: openFileMock,
                setViewState: vi.fn(async () => {}),
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
    };
};

describe('section-native-editor-session initial cursor placement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal(
            'requestAnimationFrame',
            (callback: (timestamp: number) => void) => {
                setImmediate(() => callback(0));
                return 0;
            },
        );
        getSectionContentBySection.mockReset();
        applySectionPatch.mockReset();
    });

    it('places the first day-plan edit cursor below the heading when only a heading exists', async () => {
        const sectionContent = '### 09-12';
        getSectionContentBySection.mockReturnValue(sectionContent);
        const { createFileMock, setCursorMock, focusMock, openFileMock, view } =
            createView({
                sectionContent,
                variant: 'day-plan',
            });

        await startSectionNativeEditorSession(view as never, 'node-1');

        expect(createFileMock).toHaveBeenCalledWith(
            expect.stringContaining('Mandala Grid Section Edit Sessions/'),
            '### 09-12\n',
        );
        expect(setCursorMock).toHaveBeenCalledWith({ line: 1, ch: 0 });
        expect(setCursorMock).toHaveBeenCalledTimes(1);
        expect(focusMock).toHaveBeenCalledTimes(1);
        expect(openFileMock).toHaveBeenCalledWith(expect.any(TFile), {
            active: true,
            state: {
                mode: 'source',
                source: true,
            },
            eState: {
                line: 1,
            },
        });
    });

    it('waits for the target line before assigning the day-plan cursor', async () => {
        const sectionContent = '### 09-12';
        getSectionContentBySection.mockReturnValue(sectionContent);
        const { setCursorMock, view } = createView({
            sectionContent,
            variant: 'day-plan',
            deferEditorTarget: true,
        });

        await startSectionNativeEditorSession(view as never, 'node-1');

        expect(setCursorMock).toHaveBeenCalledTimes(1);
        expect(setCursorMock).toHaveBeenCalledWith({ line: 1, ch: 0 });
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
});
