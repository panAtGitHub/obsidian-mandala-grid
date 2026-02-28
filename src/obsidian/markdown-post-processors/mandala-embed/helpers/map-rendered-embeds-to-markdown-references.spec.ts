import { describe, expect, it } from 'vitest';
import { mapRenderedEmbedsToMarkdownReferences } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-markdown-references';

describe('mapRenderedEmbedsToMarkdownReferences', () => {
    it('maps embeds to references by markdown order', () => {
        const first = {} as HTMLElement;
        const second = {} as HTMLElement;
        const matched = mapRenderedEmbedsToMarkdownReferences(
            [first, second],
            `
before
![[note#alpha]]
middle
![[note#beta|$]]
`,
        );

        expect(matched.get(first)?.link).toBe('note#alpha');
        expect(matched.get(second)?.link).toBe('note#beta');
        expect(matched.get(second)?.displayText).toBe('$');
    });

    it('returns empty mapping when markdown has no embeds', () => {
        const embed = {} as HTMLElement;
        const matched = mapRenderedEmbedsToMarkdownReferences([embed], 'plain');

        expect(matched.has(embed)).toBe(false);
    });
});
