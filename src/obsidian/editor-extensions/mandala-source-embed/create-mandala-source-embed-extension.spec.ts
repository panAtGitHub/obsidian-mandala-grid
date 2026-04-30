// @vitest-environment jsdom

import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
    Component,
    MarkdownRenderer,
    TFile,
    editorInfoField,
    editorLivePreviewField,
} from 'obsidian';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    MandalaSourceEmbedWidget,
    createMandalaSourceEmbedExtension,
} from 'src/obsidian/editor-extensions/mandala-source-embed/create-mandala-source-embed-extension';
import {
    clearLivePreviewMandalaWidgetRegistry,
    refreshLivePreviewMandalaWidgetsByTargetPaths,
} from 'src/obsidian/editor-extensions/mandala-source-embed/helpers/live-preview-mandala-widget-registry';
import type MandalaGrid from 'src/main';
import { type MandalaEmbedGridModel } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/create-mandala-embed-grid-model';

const createMarkdownFile = (path: string) =>
    Object.assign(new TFile(), {
        path,
        basename: path.replace(/\.md$/u, ''),
        extension: 'md',
        stat: {
            mtime: 1700000000000,
        },
    });

if (!('empty' in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, 'empty', {
        value(this: HTMLElement) {
            this.replaceChildren();
        },
    });
}

if (!('setText' in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, 'setText', {
        value(this: HTMLElement, text: string) {
            this.textContent = text;
        },
    });
}

Component.prototype.addChild = function <T extends Component>(child: T) {
    return child;
};

Component.prototype.removeChild = function <T extends Component>(child: T) {
    child.unload();
    return child;
};

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverMock,
});

const createPlugin = ({ targets = new Map<string, TFile>() } = {}) =>
    ({
        app: {
            metadataCache: {
                getFirstLinkpathDest: vi.fn(
                    (path: string) => targets.get(path) ?? null,
                ),
                getFileCache: vi.fn(() => null),
            },
            vault: {
                cachedRead: vi.fn(() => Promise.resolve('')),
            },
            workspace: {
                openLinkText: vi.fn(),
            },
        },
        settings: {
            getValue: () => ({
                view: {
                    mandalaGridOrientation: 'left-to-right',
                },
            }),
        },
        getMandalaEmbedRefreshEpoch: () => 0,
    }) as unknown as MandalaGrid;

const livePreviewExtensions = (sourceFile: TFile, enabled: boolean) => [
    editorInfoField.init(
        () =>
            ({
                app: {} as never,
                hoverPopover: null,
                file: sourceFile,
            }) as never,
    ),
    editorLivePreviewField.init(() => enabled),
];

const mountEditor = ({
    doc,
    plugin = createPlugin(),
    sourceFile = createMarkdownFile('source.md'),
    livePreview = true,
    anchor = doc.length,
}: {
    doc: string;
    plugin?: MandalaGrid;
    sourceFile?: TFile;
    livePreview?: boolean;
    anchor?: number;
}) => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    const view = new EditorView({
        state: EditorState.create({
            doc,
            selection: { anchor },
            extensions: [
                ...livePreviewExtensions(sourceFile, livePreview),
                createMandalaSourceEmbedExtension(plugin),
            ],
        }),
        parent,
    });

    return { view, parent };
};

const mountedViews: EditorView[] = [];

const trackView = (view: EditorView) => {
    mountedViews.push(view);
    return view;
};

const waitForAssertion = async (assertion: () => void) => {
    const timeoutAt = Date.now() + 2000;

    while (true) {
        try {
            assertion();
            return;
        } catch (error) {
            if (Date.now() >= timeoutAt) throw error;
            await new Promise((resolve) => window.setTimeout(resolve, 10));
        }
    }
};

const mockMarkdownRenderer = () => {
    vi.spyOn(MarkdownRenderer, 'render').mockImplementation(
        (_app, markdown, element) => {
            element.setText(markdown);
            return Promise.resolve();
        },
    );
};

const createGridModel = (content: string): MandalaEmbedGridModel => ({
    rows: [
        [
            {
                section: '1.1',
                markdown: content,
                title: '',
                body: content,
                empty: false,
            },
            {
                section: '1.2',
                markdown: '',
                title: '',
                body: '',
                empty: true,
            },
            {
                section: '1.3',
                markdown: '',
                title: '',
                body: '',
                empty: true,
            },
        ],
        [
            {
                section: '1.4',
                markdown: '',
                title: '',
                body: '',
                empty: true,
            },
            {
                section: '1',
                markdown: '中心',
                title: '一页纸工具',
                body: '中心',
                empty: false,
            },
            {
                section: '1.5',
                markdown: '',
                title: '',
                body: '',
                empty: true,
            },
        ],
        [
            {
                section: '1.6',
                markdown: '',
                title: '',
                body: '',
                empty: true,
            },
            {
                section: '1.7',
                markdown: '',
                title: '',
                body: '',
                empty: true,
            },
            {
                section: '1.8',
                markdown: '',
                title: '',
                body: '',
                empty: true,
            },
        ],
    ],
});

const mountWidget = ({
    plugin = createPlugin(),
    sourceFile = createMarkdownFile('source.md'),
    targetFile = createMarkdownFile('写作，一页纸工具.md'),
    original = '![[写作，一页纸工具#一页纸工具|$]]',
    renderKey = 'widget-key',
    loadResolvedModel,
}: {
    plugin?: MandalaGrid;
    sourceFile?: TFile;
    targetFile?: TFile;
    original?: string;
    renderKey?: string;
    loadResolvedModel: () => Promise<{
        target: {
            file: TFile;
            centerHeading: string | null;
        };
        model: MandalaEmbedGridModel;
    } | null>;
}) => {
    const widget = new MandalaSourceEmbedWidget(
        plugin,
        sourceFile,
        '写作，一页纸工具#一页纸工具',
        original,
        renderKey,
        0,
        original.length,
        loadResolvedModel,
    );
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const root = widget.toDOM({
        dispatch: vi.fn(),
        focus: vi.fn(),
    } as unknown as EditorView);
    parent.appendChild(root);

    return {
        widget,
        root,
        parent,
        targetFile,
    };
};

afterEach(() => {
    while (mountedViews.length > 0) {
        mountedViews.pop()?.destroy();
    }
    clearLivePreviewMandalaWidgetRegistry();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('createMandalaSourceEmbedExtension', () => {
    it('renders a widget for standalone heading dollar embeds in live preview', () => {
        const { view } = mountEditor({
            doc: '![[写作，一页纸工具#一页纸工具|$]]\n',
        });
        trackView(view);

        expect(
            view.dom.querySelectorAll('.mandala-source-embed-widget'),
        ).toHaveLength(1);
    });

    it('hides the widget when the caret is on the embed line boundary', () => {
        const doc = '![[写作，一页纸工具#一页纸工具|$]]';
        const { view } = mountEditor({
            doc,
            anchor: doc.length,
        });
        trackView(view);

        expect(
            view.dom.querySelector('.mandala-source-embed-widget'),
        ).toBeNull();
    });

    it('does not render widgets for file-only, block, or non-dollar embeds', () => {
        const invalidDocs = [
            '![[写作，一页纸工具#一页纸工具]]\n',
            '![[写作，一页纸工具|$]]\n',
            '![[写作，一页纸工具#^block-id|$]]\n',
        ];

        for (const doc of invalidDocs) {
            const { view } = mountEditor({ doc });
            trackView(view);

            expect(
                view.dom.querySelector('.mandala-source-embed-widget'),
            ).toBeNull();
        }
    });

    it('hides the widget while the caret is inside the embed and restores it after leaving', () => {
        const doc = '![[写作，一页纸工具#一页纸工具|$]]\n';
        const { view } = mountEditor({ doc });
        trackView(view);

        expect(
            view.dom.querySelector('.mandala-source-embed-widget'),
        ).not.toBeNull();

        view.dispatch({
            selection: {
                anchor: 2,
            },
        });

        expect(
            view.dom.querySelector('.mandala-source-embed-widget'),
        ).toBeNull();

        view.dispatch({
            selection: {
                anchor: doc.length,
            },
        });

        expect(
            view.dom.querySelector('.mandala-source-embed-widget'),
        ).not.toBeNull();
    });

    it('keeps the widget when the caret moves to a different line', () => {
        const doc = ['![[写作，一页纸工具#一页纸工具|$]]', '下一行', ''].join(
            '\n',
        );
        const nextLineAnchor = doc.indexOf('下一行');
        const { view } = mountEditor({
            doc,
            anchor: nextLineAnchor,
        });
        trackView(view);

        expect(
            view.dom.querySelector('.mandala-source-embed-widget'),
        ).not.toBeNull();
    });

    it('hides the widget when the caret is at the start of the embed line', () => {
        const doc = [
            '上一行',
            '![[写作，一页纸工具#一页纸工具|$]]',
            '下一行',
            '',
        ].join('\n');
        const embedStart = doc.indexOf('![[写作，一页纸工具#一页纸工具|$]]');
        const { view } = mountEditor({
            doc,
            anchor: embedStart,
        });
        trackView(view);

        expect(
            view.dom.querySelector('.mandala-source-embed-widget'),
        ).toBeNull();
    });

    it('does not render widgets outside live preview', () => {
        const { view } = mountEditor({
            doc: '![[写作，一页纸工具#一页纸工具|$]]\n',
            livePreview: false,
        });
        trackView(view);

        expect(
            view.dom.querySelector('.mandala-source-embed-widget'),
        ).toBeNull();
    });

    it('renders multiple widgets for multiple standalone dollar embeds', () => {
        const { view } = mountEditor({
            doc: [
                '![[写作，一页纸工具#一页纸工具|$]]',
                '',
                '![[写作，一页纸工具#一页九宫格|$]]',
                '',
            ].join('\n'),
        });
        trackView(view);

        expect(
            view.dom.querySelectorAll('.mandala-source-embed-widget'),
        ).toHaveLength(2);
    });

    it('refreshes widget content in place when the target note changes', async () => {
        mockMarkdownRenderer();
        const targetFile = createMarkdownFile('写作，一页纸工具.md');
        let gridContent = '初始内容';
        const { root } = mountWidget({
            targetFile,
            loadResolvedModel: () =>
                Promise.resolve({
                    target: {
                        file: targetFile,
                        centerHeading: '一页纸工具',
                    },
                    model: createGridModel(gridContent),
                }),
        });

        await waitForAssertion(() => {
            expect(root.textContent).toContain('初始内容');
        });

        const widgetRoot = root;

        gridContent = '更新内容';
        targetFile.stat.mtime += 1;
        await refreshLivePreviewMandalaWidgetsByTargetPaths([targetFile.path]);

        await waitForAssertion(() => {
            expect(root.textContent).toContain('更新内容');
        });

        expect(root).toBe(widgetRoot);
    });

    it('skips replacing the rendered host when the resolved render key is unchanged', async () => {
        mockMarkdownRenderer();
        const targetFile = createMarkdownFile('写作，一页纸工具.md');
        const { root } = mountWidget({
            targetFile,
            loadResolvedModel: () =>
                Promise.resolve({
                    target: {
                        file: targetFile,
                        centerHeading: '一页纸工具',
                    },
                    model: createGridModel('稳定内容'),
                }),
        });

        await waitForAssertion(() => {
            expect(root.textContent).toContain('稳定内容');
        });

        const host = root.querySelector('.mandala-embed-host');
        expect(host).not.toBeNull();

        await refreshLivePreviewMandalaWidgetsByTargetPaths([targetFile.path]);

        expect(root.querySelector('.mandala-embed-host')).toBe(host);
    });

    it('falls back to the original embed text when the target can no longer resolve', async () => {
        mockMarkdownRenderer();
        const targetFile = createMarkdownFile('写作，一页纸工具.md');
        let isResolvable = true;
        const { root } = mountWidget({
            targetFile,
            loadResolvedModel: () =>
                Promise.resolve(
                    isResolvable
                        ? {
                              target: {
                                  file: targetFile,
                                  centerHeading: '一页纸工具',
                              },
                              model: createGridModel('初始内容'),
                          }
                        : null,
                ),
        });

        await waitForAssertion(() => {
            expect(root.textContent).toContain('初始内容');
        });

        const widgetRoot = root;

        isResolvable = false;
        targetFile.stat.mtime += 1;
        await refreshLivePreviewMandalaWidgetsByTargetPaths([targetFile.path]);

        await waitForAssertion(() => {
            expect(root.textContent).toContain(
                '![[写作，一页纸工具#一页纸工具|$]]',
            );
        });

        expect(root).toBe(widgetRoot);
    });
});
