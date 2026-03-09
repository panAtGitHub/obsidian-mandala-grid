import { TFile } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';
import {
    collectMandalaEmbedTargetPaths,
    resolveMandalaEmbedRefreshPlan,
    type MandalaEmbedRefreshViewLike,
} from 'src/obsidian/events/workspace/register-mandala-embed-refresh-events';

const createMarkdownFile = (path: string) =>
    Object.assign(new TFile(), {
        path,
        basename: path.replace(/\.md$/u, ''),
        extension: 'md',
        stat: {
            mtime: 1700000000000,
        },
    });

const createPlugin = () => {
    const targets = new Map<string, TFile>([
        ['写作，一页纸工具', createMarkdownFile('写作，一页纸工具.md')],
        ['另一份笔记', createMarkdownFile('另一份笔记.md')],
    ]);

    return {
        app: {
            metadataCache: {
                getFirstLinkpathDest: vi.fn((path: string) => targets.get(path) ?? null),
            },
        },
    } as never;
};

describe('registerMandalaEmbedRefreshEvents helpers', () => {
    it('collects only valid mandala embed target paths', () => {
        const plugin = createPlugin();
        const sourceFile = createMarkdownFile('source.md');

        const targetPaths = collectMandalaEmbedTargetPaths(
            plugin,
            sourceFile,
            [
                '![[写作，一页纸工具#一页纸工具|$]]',
                '![[写作，一页纸工具#一页纸工具]]',
                '![[写作，一页纸工具#^block|$]]',
                '![[另一份笔记#标题|$]]',
            ].join('\n'),
        );

        expect(Array.from(targetPaths)).toEqual([
            '写作，一页纸工具.md',
            '另一份笔记.md',
        ]);
    });

    it('refreshes only impacted open views for target changes', () => {
        const plugin = createPlugin();
        const views: MandalaEmbedRefreshViewLike[] = [
            {
                file: createMarkdownFile('source-a.md'),
                mode: 'source',
                markdown: '![[写作，一页纸工具#一页纸工具|$]]',
            },
            {
                file: createMarkdownFile('source-b.md'),
                mode: 'preview',
                markdown: '![[写作，一页纸工具#一页纸工具|$]]',
            },
            {
                file: createMarkdownFile('source-c.md'),
                mode: 'preview',
                markdown: '![[另一份笔记#标题|$]]',
            },
        ];

        const plan = resolveMandalaEmbedRefreshPlan(plugin, views, [
            '写作，一页纸工具.md',
        ]);

        expect(plan.previewSourcePaths.size).toBe(0);
        expect(Array.from(plan.previewTargetPaths)).toEqual([
            '写作，一页纸工具.md',
        ]);
        expect(Array.from(plan.livePreviewTargetPaths)).toEqual([
            '写作，一页纸工具.md',
        ]);
    });

    it('refreshes a preview when its own source note changes', () => {
        const plugin = createPlugin();
        const views: MandalaEmbedRefreshViewLike[] = [
            {
                file: createMarkdownFile('source-a.md'),
                mode: 'preview',
                markdown: '普通文本',
            },
        ];

        const plan = resolveMandalaEmbedRefreshPlan(plugin, views, [
            'source-a.md',
        ]);

        expect(Array.from(plan.previewSourcePaths)).toEqual(['source-a.md']);
        expect(plan.previewTargetPaths.size).toBe(0);
        expect(plan.livePreviewTargetPaths.size).toBe(0);
    });

    it('skips refresh when no open view depends on the changed file', () => {
        const plugin = createPlugin();
        const views: MandalaEmbedRefreshViewLike[] = [
            {
                file: createMarkdownFile('source-a.md'),
                mode: 'source',
                markdown: '![[另一份笔记#标题|$]]',
            },
        ];

        const plan = resolveMandalaEmbedRefreshPlan(plugin, views, [
            '写作，一页纸工具.md',
        ]);

        expect(plan.previewSourcePaths.size).toBe(0);
        expect(plan.previewTargetPaths.size).toBe(0);
        expect(plan.livePreviewTargetPaths.size).toBe(0);
    });

    it('routes impacted live preview target changes to livePreviewTargetPaths', () => {
        const plugin = createPlugin();
        const views: MandalaEmbedRefreshViewLike[] = [
            {
                file: createMarkdownFile('source-a.md'),
                mode: 'source',
                markdown: '![[写作，一页纸工具#一页纸工具|$]]',
            },
        ];

        const plan = resolveMandalaEmbedRefreshPlan(plugin, views, [
            '写作，一页纸工具.md',
        ]);

        expect(plan.previewSourcePaths.size).toBe(0);
        expect(plan.previewTargetPaths.size).toBe(0);
        expect(Array.from(plan.livePreviewTargetPaths)).toEqual([
            '写作，一页纸工具.md',
        ]);
    });
});
