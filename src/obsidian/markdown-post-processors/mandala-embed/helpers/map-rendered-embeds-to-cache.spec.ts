import { describe, expect, it } from 'vitest';
import { type EmbedCache, type MarkdownSectionInformation } from 'obsidian';
import { mapRenderedEmbedsToCache } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/map-rendered-embeds-to-cache';

const createEmbedCache = (
    line: number,
    offset: number,
    link: string,
    displayText?: string,
) =>
    ({
        link,
        original: `![[${link}${displayText ? `|${displayText}` : ''}]]`,
        displayText,
        position: {
            start: { line, col: 0, offset },
            end: { line, col: 1, offset: offset + 1 },
        },
    }) as EmbedCache;

describe('mapRenderedEmbedsToCache', () => {
    it('matches rendered embeds to cached embeds in source order within a section', () => {
        const first = {} as HTMLElement;
        const second = {} as HTMLElement;

        const references = [
            createEmbedCache(4, 120, 'note#alpha'),
            createEmbedCache(2, 30, 'note#beta', '$'),
        ];
        const sectionInfo: MarkdownSectionInformation = {
            text: 'section a',
            lineStart: 1,
            lineEnd: 5,
        };

        const matched = mapRenderedEmbedsToCache(
            [first, second],
            references,
            () => sectionInfo,
        );

        expect(matched.get(first)?.link).toBe('note#beta');
        expect(matched.get(second)?.link).toBe('note#alpha');
    });

    it('keeps matching stable when regular embeds and mandala embeds are mixed', () => {
        const firstSectionRegular = {} as HTMLElement;
        const firstSectionMandala = {} as HTMLElement;
        const secondSectionMandala = {} as HTMLElement;

        const references = [
            createEmbedCache(2, 10, 'note#regular'),
            createEmbedCache(4, 40, 'note#mandala-a', '$'),
            createEmbedCache(12, 100, 'note#mandala-b', '$'),
        ];

        const sections = new Map<HTMLElement, MarkdownSectionInformation>([
            [
                firstSectionRegular,
                { text: 'section 1', lineStart: 1, lineEnd: 5 },
            ],
            [
                firstSectionMandala,
                { text: 'section 1', lineStart: 1, lineEnd: 5 },
            ],
            [
                secondSectionMandala,
                { text: 'section 2', lineStart: 10, lineEnd: 14 },
            ],
        ]);

        const matched = mapRenderedEmbedsToCache(
            [firstSectionRegular, firstSectionMandala, secondSectionMandala],
            references,
            (embed) => sections.get(embed) ?? null,
        );

        expect(matched.get(firstSectionRegular)?.link).toBe('note#regular');
        expect(matched.get(firstSectionMandala)?.link).toBe('note#mandala-a');
        expect(matched.get(secondSectionMandala)?.link).toBe('note#mandala-b');
    });

    it('returns no match when section info is missing', () => {
        const embed = {} as HTMLElement;
        const matched = mapRenderedEmbedsToCache(
            [embed],
            [createEmbedCache(2, 20, 'note#alpha', '$')],
            () => null,
        );

        expect(matched.has(embed)).toBe(false);
    });

    it('returns no match when cached embeds are empty', () => {
        const embed = {} as HTMLElement;
        const matched = mapRenderedEmbedsToCache(
            [embed],
            [],
            () => ({
                text: 'section',
                lineStart: 1,
                lineEnd: 3,
            }),
        );

        expect(matched.has(embed)).toBe(false);
    });
});
