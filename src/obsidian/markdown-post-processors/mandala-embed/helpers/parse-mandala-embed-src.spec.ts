import { describe, expect, it } from 'vitest';
import { parseMandalaEmbedSrc } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-src';

describe('parseMandalaEmbedSrc', () => {
    it('returns null for empty source', () => {
        expect(parseMandalaEmbedSrc(null)).toBeNull();
        expect(parseMandalaEmbedSrc('   ')).toBeNull();
    });

    it('returns null when marker is missing', () => {
        expect(parseMandalaEmbedSrc('mandala')).toBeNull();
        expect(parseMandalaEmbedSrc('mandala#2026-02-23')).toBeNull();
    });

    it('parses marker-ended syntax as mandala embed source', () => {
        expect(parseMandalaEmbedSrc('mandala$')).toEqual({
            linktext: 'mandala',
        });
        expect(parseMandalaEmbedSrc('mandala#2026-02-23$')).toEqual({
            linktext: 'mandala#2026-02-23',
        });
        expect(parseMandalaEmbedSrc('$')).toBeNull();
    });
});
