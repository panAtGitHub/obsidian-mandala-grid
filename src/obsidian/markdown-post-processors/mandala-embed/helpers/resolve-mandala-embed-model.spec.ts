import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TFile, resolveSubpath } from 'obsidian';
import {
    buildMandalaEmbedModelCacheKey,
    getMandalaEmbedOrientation,
    resolveMandalaEmbedModel,
    resolveMandalaEmbedTarget,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/resolve-mandala-embed-model';

vi.mock('obsidian', async () => {
    const actual = await vi.importActual<typeof import('obsidian')>('obsidian');
    return {
        ...actual,
        resolveSubpath: vi.fn(),
    };
});

const createMarkdownFile = (path: string) =>
    Object.assign(new TFile(), {
        path,
        basename: path.replace(/\.md$/u, ''),
        extension: 'md',
        stat: {
            mtime: 1700000000000,
        },
    });

const buildMandalaMarkdown = () => `---
mandala: true
---
<!--section: 1-->
# 一页纸工具

<!--section: 1.1-->
## 一页九宫格
主题一

<!--section: 1.2-->
## 一页白板
主题二

<!--section: 1.3-->
主题三

<!--section: 1.4-->
主题四

<!--section: 1.5-->
主题五

<!--section: 1.6-->
主题六

<!--section: 1.7-->
主题七

<!--section: 1.8-->
主题八
`;

describe('resolveMandalaEmbedModel', () => {
    const mockedResolveSubpath = vi.mocked(resolveSubpath);

    beforeEach(() => {
        mockedResolveSubpath.mockReset();
    });

    it('resolves a heading dollar embed to target file and 3x3 model', async () => {
        const sourceFile = createMarkdownFile('一页纸，管理目标，81格工具.md');
        const targetFile = createMarkdownFile('写作，一页纸工具.md');
        const plugin = {
            app: {
                metadataCache: {
                    getFirstLinkpathDest: vi.fn((path: string) =>
                        path === '写作，一页纸工具' ? targetFile : null,
                    ),
                    getFileCache: vi.fn(() => ({})),
                },
                vault: {
                    cachedRead: vi.fn(async () => buildMandalaMarkdown()),
                },
            },
            settings: {
                getValue: () => ({
                    view: {
                        mandalaGridOrientation: 'left-to-right',
                    },
                }),
            },
        } as never;
        mockedResolveSubpath.mockReturnValue({
            start: { line: 4, col: 0, offset: 0 },
            end: null,
        } as never);

        const resolved = await resolveMandalaEmbedModel(
            plugin,
            sourceFile,
            {
                linktext: '写作，一页纸工具#一页纸工具',
            },
            getMandalaEmbedOrientation(plugin),
        );

        expect(resolved?.target.file.path).toBe('写作，一页纸工具.md');
        expect(resolved?.target.centerHeading).toBe('一页纸工具');
        expect(resolved?.model.rows[1]?.[1]?.section).toBe('1');
    });

    it('returns null when the heading cannot be mapped to a mandala section', async () => {
        const sourceFile = createMarkdownFile('source.md');
        const targetFile = createMarkdownFile('target.md');
        const plugin = {
            app: {
                metadataCache: {
                    getFirstLinkpathDest: vi.fn(() => targetFile),
                    getFileCache: vi.fn(() => ({})),
                },
                vault: {
                    cachedRead: vi.fn(async () => buildMandalaMarkdown()),
                },
            },
            settings: {
                getValue: () => ({
                    view: {
                        mandalaGridOrientation: 'left-to-right',
                    },
                }),
            },
        } as never;
        mockedResolveSubpath.mockReturnValue(null);

        const resolved = await resolveMandalaEmbedModel(
            plugin,
            sourceFile,
            {
                linktext: 'target#missing',
            },
            'left-to-right',
        );

        expect(resolved).toBeNull();
    });

    it('rejects file-only and block references at target resolution time', () => {
        const sourceFile = createMarkdownFile('source.md');
        const targetFile = createMarkdownFile('target.md');
        const plugin = {
            app: {
                metadataCache: {
                    getFirstLinkpathDest: vi.fn(() => targetFile),
                },
            },
        } as never;

        expect(
            resolveMandalaEmbedTarget(plugin, sourceFile, {
                linktext: 'target',
            }),
        ).toBeNull();
        expect(
            resolveMandalaEmbedTarget(plugin, sourceFile, {
                linktext: 'target#^block-id',
            }),
        ).toBeNull();
    });

    it('builds stable cache keys from target and orientation', () => {
        const target = {
            file: createMarkdownFile('target.md'),
            centerHeading: '一页纸工具',
        };

        expect(
            buildMandalaEmbedModelCacheKey(target, 'left-to-right'),
        ).toContain('target.md');
        expect(
            buildMandalaEmbedModelCacheKey(target, 'left-to-right'),
        ).toContain('一页纸工具');
    });
});
