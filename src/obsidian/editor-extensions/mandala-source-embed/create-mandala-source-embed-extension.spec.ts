// @vitest-environment jsdom

import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { TFile, editorInfoField, editorLivePreviewField } from 'obsidian';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMandalaSourceEmbedExtension } from 'src/obsidian/editor-extensions/mandala-source-embed/create-mandala-source-embed-extension';

const createMarkdownFile = (path: string) =>
    Object.assign(new TFile(), {
        path,
        basename: path.replace(/\.md$/u, ''),
        extension: 'md',
        stat: {
            mtime: 1700000000000,
        },
    });

const createPlugin = () =>
    ({
        app: {
            metadataCache: {
                getFirstLinkpathDest: vi.fn(() => null),
                getFileCache: vi.fn(() => null),
            },
            vault: {
                cachedRead: vi.fn(async () => ''),
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
    }) as never;

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
    sourceFile = createMarkdownFile('source.md'),
    livePreview = true,
    anchor = doc.length,
}: {
    doc: string;
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
                createMandalaSourceEmbedExtension(createPlugin()),
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

afterEach(() => {
    while (mountedViews.length > 0) {
        mountedViews.pop()?.destroy();
    }
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
});
