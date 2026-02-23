import { describe, expect, it } from 'vitest';
import { parseMandalaEmbedSrc } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-src';

describe('parseMandalaEmbedSrc', () => {
    it('returns null for empty source', () => {
        expect(parseMandalaEmbedSrc(null)).toBeNull();
        expect(parseMandalaEmbedSrc('   ')).toBeNull();
    });

    it('keeps plain embed source unchanged', () => {
        expect(parseMandalaEmbedSrc('mandala')).toEqual({
            linktext: 'mandala',
            centerSection: null,
        });
    });

    it('parses custom center section syntax', () => {
        expect(parseMandalaEmbedSrc('mandala$3.1')).toEqual({
            linktext: 'mandala',
            centerSection: '3.1',
        });
    });

    it('does not parse invalid section suffix', () => {
        expect(parseMandalaEmbedSrc('mandala$abc')).toEqual({
            linktext: 'mandala$abc',
            centerSection: null,
        });
        expect(parseMandalaEmbedSrc('mandala$')).toEqual({
            linktext: 'mandala$',
            centerSection: null,
        });
    });
});

