import { describe, expect, it } from 'vitest';
import { parseMandalaEmbedReference } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';

describe('parseMandalaEmbedReference', () => {
    it('returns null for empty reference', () => {
        expect(parseMandalaEmbedReference(null)).toBeNull();
    });

    it('accepts heading references marked by alias', () => {
        expect(
            parseMandalaEmbedReference({
                link: 'mandala#2026-02-23',
                displayText: '$',
                original: '![[mandala#2026-02-23|$]]',
            }),
        ).toEqual({
            linktext: 'mandala#2026-02-23',
        });
    });

    it('accepts chinese file names and headings', () => {
        expect(
            parseMandalaEmbedReference({
                link: '00，个人回顾，试验1#个人成长2',
                displayText: '$',
                original: '![[00，个人回顾，试验1#个人成长2|$]]',
            }),
        ).toEqual({
            linktext: '00，个人回顾，试验1#个人成长2',
        });
    });

    it('accepts alias marker with surrounding whitespace', () => {
        expect(
            parseMandalaEmbedReference({
                link: 'mandala#2026-02-23',
                displayText: ' $ ',
                original: '![[mandala#2026-02-23| $ ]]',
            }),
        ).toEqual({
            linktext: 'mandala#2026-02-23',
        });
    });

    it('rejects references without alias marker', () => {
        expect(
            parseMandalaEmbedReference({
                link: 'mandala#2026-02-23',
                original: '![[mandala#2026-02-23]]',
            }),
        ).toBeNull();
        expect(
            parseMandalaEmbedReference({
                link: 'mandala#2026-02-23',
                displayText: 'preview',
                original: '![[mandala#2026-02-23|preview]]',
            }),
        ).toBeNull();
    });

    it('rejects file-only and block references', () => {
        expect(
            parseMandalaEmbedReference({
                link: 'mandala',
                displayText: '$',
                original: '![[mandala|$]]',
            }),
        ).toBeNull();
        expect(
            parseMandalaEmbedReference({
                link: 'mandala#^block-id',
                displayText: '$',
                original: '![[mandala#^block-id|$]]',
            }),
        ).toBeNull();
    });

    it('rejects old marker syntax embedded in the heading', () => {
        expect(
            parseMandalaEmbedReference({
                link: 'mandala#2026-02-23$',
                displayText: '$',
                original: '![[mandala#2026-02-23$|$]]',
            }),
        ).toBeNull();
    });
});
