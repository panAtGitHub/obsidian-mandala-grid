import { describe, expect, it } from 'vitest';
import { mapRenderedEmbedsToDocumentReferences } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-document-references';
import { parseMandalaEmbedReference } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';

const getReferenceKey = (linktext: string) => {
    const parsed = parseMandalaEmbedReference({
        link: linktext,
        displayText: '$',
        original: `![[${linktext}|$]]`,
    });
    return parsed?.linktext ?? null;
};

const getMandalaReferenceKey = (reference: {
    link: string;
    displayText?: string;
    original: string;
}) => {
    const parsed = parseMandalaEmbedReference(reference);
    return parsed?.linktext ?? null;
};

describe('mapRenderedEmbedsToDocumentReferences', () => {
    it('matches heading dollar embeds from whole-document markdown', () => {
        const embed = {
            dataset: { src: '写作，一页纸工具#一页纸工具' },
        } as unknown as HTMLElement;

        const matched = mapRenderedEmbedsToDocumentReferences(
            [embed],
            `
普通文本
![[写作，一页纸工具#一页纸工具|$]]
`,
            (currentEmbed) => getReferenceKey(currentEmbed.dataset.src ?? ''),
            getMandalaReferenceKey,
        );

        expect(matched.get(embed)?.link).toBe('写作，一页纸工具#一页纸工具');
        expect(matched.get(embed)?.displayText).toBe('$');
    });

    it('consumes duplicate matches in document order', () => {
        const first = {
            dataset: { src: 'file#heading' },
        } as unknown as HTMLElement;
        const second = {
            dataset: { src: 'file#heading' },
        } as unknown as HTMLElement;

        const matched = mapRenderedEmbedsToDocumentReferences(
            [first, second],
            `
![[file#heading|$]]
中间内容
![[file#heading|$]]
`,
            (embed) => getReferenceKey(embed.dataset.src ?? ''),
            getMandalaReferenceKey,
        );

        expect(matched.get(first)?.original).toBe('![[file#heading|$]]');
        expect(matched.get(second)?.original).toBe('![[file#heading|$]]');
        expect(matched.size).toBe(2);
    });

    it('ignores embeds without the dollar alias marker', () => {
        const embed = {
            dataset: { src: 'file#heading' },
        } as unknown as HTMLElement;

        const matched = mapRenderedEmbedsToDocumentReferences(
            [embed],
            '![[file#heading]]',
            (currentEmbed) => getReferenceKey(currentEmbed.dataset.src ?? ''),
            getMandalaReferenceKey,
        );

        expect(matched.has(embed)).toBe(false);
    });

    it('keeps rejecting file-only and block dollar embeds', () => {
        const fileOnly = {
            dataset: { src: 'file' },
        } as unknown as HTMLElement;
        const block = {
            dataset: { src: 'file#^block-id' },
        } as unknown as HTMLElement;

        const matched = mapRenderedEmbedsToDocumentReferences(
            [fileOnly, block],
            `
![[file|$]]
![[file#^block-id|$]]
`,
            (embed) => getReferenceKey(embed.dataset.src ?? ''),
            getMandalaReferenceKey,
        );

        expect(matched.has(fileOnly)).toBe(false);
        expect(matched.has(block)).toBe(false);
    });
});
