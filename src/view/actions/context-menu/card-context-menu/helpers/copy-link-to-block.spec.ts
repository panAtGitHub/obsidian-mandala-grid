import { describe, expect, it } from 'vitest';
import { buildBlockWikiLink } from 'src/view/actions/context-menu/card-context-menu/helpers/copy-link-to-block';

describe('buildBlockWikiLink', () => {
    it('builds plain block wiki link', () => {
        expect(buildBlockWikiLink('2026年，日计划', 'jytr3o', false)).toBe(
            '[[2026年，日计划#^jytr3o]]',
        );
    });

    it('builds embed block wiki link', () => {
        expect(buildBlockWikiLink('2026年，日计划', 'jytr3o', true)).toBe(
            '![[2026年，日计划#^jytr3o]]',
        );
    });
});
