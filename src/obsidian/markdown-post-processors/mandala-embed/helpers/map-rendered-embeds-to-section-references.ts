import { type MarkdownSectionInformation } from 'obsidian';
import { type MandalaEmbedReferenceLike } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';
import { extractEmbedReferencesFromMarkdown } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/extract-embed-references-from-markdown';

const getSectionKey = (section: MarkdownSectionInformation) =>
    `${section.lineStart}:${section.lineEnd}:${section.text}`;

export const mapRenderedEmbedsToSectionReferences = (
    renderedEmbeds: HTMLElement[],
    getSectionInfo: (embed: HTMLElement) => MarkdownSectionInformation | null,
) => {
    const matchedReferences = new Map<HTMLElement, MandalaEmbedReferenceLike>();
    const sectionReferences = new Map<string, MandalaEmbedReferenceLike[]>();
    const sectionOffsets = new Map<string, number>();

    for (const embed of renderedEmbeds) {
        const section = getSectionInfo(embed);
        if (!section) continue;

        const key = getSectionKey(section);
        if (!sectionReferences.has(key)) {
            sectionReferences.set(
                key,
                extractEmbedReferencesFromMarkdown(section.text),
            );
        }

        const matchedInSection = sectionReferences.get(key) ?? [];
        const currentOffset = sectionOffsets.get(key) ?? 0;
        const reference = matchedInSection[currentOffset];
        sectionOffsets.set(key, currentOffset + 1);

        if (reference) {
            matchedReferences.set(embed, reference);
        }
    }

    return matchedReferences;
};
