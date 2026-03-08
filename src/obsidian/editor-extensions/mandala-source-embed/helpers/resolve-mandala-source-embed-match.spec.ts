import { describe, expect, it } from 'vitest';
import { resolveMandalaSourceEmbedMatch } from 'src/obsidian/editor-extensions/mandala-source-embed/helpers/resolve-mandala-source-embed-match';

describe('resolveMandalaSourceEmbedMatch', () => {
    it('accepts standalone heading dollar embeds when selection is away', () => {
        const resolved = resolveMandalaSourceEmbedMatch({
            matchText: '![[写作，一页纸工具#一页纸工具|$]]',
            from: 10,
            to: 34,
            textBeforeMatch: '  ',
            textAfterMatch: '  ',
            selectionRanges: [{ from: 0, to: 0 }],
        });

        expect(resolved?.reference.link).toBe('写作，一页纸工具#一页纸工具');
        expect(resolved?.parsedReference.linktext).toBe(
            '写作，一页纸工具#一页纸工具',
        );
    });

    it('rejects references without the dollar alias marker', () => {
        const resolved = resolveMandalaSourceEmbedMatch({
            matchText: '![[写作，一页纸工具#一页纸工具]]',
            from: 10,
            to: 30,
            textBeforeMatch: '',
            textAfterMatch: '',
            selectionRanges: [],
        });

        expect(resolved).toBeNull();
    });

    it('rejects inline embeds that are not standalone on the line', () => {
        const resolved = resolveMandalaSourceEmbedMatch({
            matchText: '![[写作，一页纸工具#一页纸工具|$]]',
            from: 10,
            to: 34,
            textBeforeMatch: '- ',
            textAfterMatch: '',
            selectionRanges: [],
        });

        expect(resolved).toBeNull();
    });

    it('falls back to raw syntax when selection touches the embed range', () => {
        const resolved = resolveMandalaSourceEmbedMatch({
            matchText: '![[写作，一页纸工具#一页纸工具|$]]',
            from: 10,
            to: 34,
            textBeforeMatch: '',
            textAfterMatch: '',
            selectionRanges: [{ from: 11, to: 11 }],
        });

        expect(resolved).toBeNull();
    });

    it('keeps the widget when the caret is exactly at the embed boundary', () => {
        const resolved = resolveMandalaSourceEmbedMatch({
            matchText: '![[写作，一页纸工具#一页纸工具|$]]',
            from: 10,
            to: 34,
            textBeforeMatch: '',
            textAfterMatch: '',
            selectionRanges: [{ from: 34, to: 34 }],
        });

        expect(resolved?.parsedReference.linktext).toBe(
            '写作，一页纸工具#一页纸工具',
        );
    });
});
