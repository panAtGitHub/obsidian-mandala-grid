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
        expect(parseMandalaEmbedSrc('mandala#2026-02-23%24')).toEqual({
            linktext: 'mandala#2026-02-23',
        });
        expect(
            parseMandalaEmbedSrc(
                '2026%E5%B9%B4%EF%BC%8C%E6%97%A5%E8%AE%A1%E5%88%92%232026-02-23%24',
            ),
        ).toEqual({
            linktext: '2026年，日计划#2026-02-23',
        });
        expect(parseMandalaEmbedSrc('$')).toBeNull();
    });
});
