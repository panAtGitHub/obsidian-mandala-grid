import { describe, expect, it } from 'vitest';
import { type MarkdownSectionInformation } from 'obsidian';
import { mapRenderedEmbedsToSectionReferences } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-section-references';

describe('mapRenderedEmbedsToSectionReferences', () => {
    it('maps embeds by raw markdown order inside the same section', () => {
        const first = {} as HTMLElement;
        const second = {} as HTMLElement;
        const section: MarkdownSectionInformation = {
            text: `
before
![[note#regular]]
![[note#mandala|$]]
`,
            lineStart: 1,
            lineEnd: 4,
        };

        const matched = mapRenderedEmbedsToSectionReferences(
            [first, second],
            () => section,
        );

        expect(matched.get(first)?.link).toBe('note#regular');
        expect(matched.get(second)?.link).toBe('note#mandala');
        expect(matched.get(second)?.displayText).toBe('$');
    });

    it('supports different sections independently', () => {
        const first = {} as HTMLElement;
        const second = {} as HTMLElement;
        const sections = new Map<HTMLElement, MarkdownSectionInformation>([
            [
                first,
                {
                    text: '![[a#one|$]]',
                    lineStart: 1,
                    lineEnd: 1,
                },
            ],
            [
                second,
                {
                    text: '![[b#two|$]]',
                    lineStart: 2,
                    lineEnd: 2,
                },
            ],
        ]);

        const matched = mapRenderedEmbedsToSectionReferences(
            [first, second],
            (embed) => sections.get(embed) ?? null,
        );

        expect(matched.get(first)?.link).toBe('a#one');
        expect(matched.get(second)?.link).toBe('b#two');
    });

    it('returns no match when section info is missing', () => {
        const embed = {} as HTMLElement;
        const matched = mapRenderedEmbedsToSectionReferences([embed], () => null);

        expect(matched.has(embed)).toBe(false);
    });
});
