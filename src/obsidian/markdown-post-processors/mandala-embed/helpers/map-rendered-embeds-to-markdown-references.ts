import { type MandalaEmbedReferenceLike } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';
import { extractEmbedReferencesFromMarkdown } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/extract-embed-references-from-markdown';

export const mapRenderedEmbedsToMarkdownReferences = (
    renderedEmbeds: HTMLElement[],
    markdown: string,
) => {
    const matchedReferences = new Map<HTMLElement, MandalaEmbedReferenceLike>();
    const references = extractEmbedReferencesFromMarkdown(markdown);

    renderedEmbeds.forEach((embed, index) => {
        const reference = references[index];
        if (reference) {
            matchedReferences.set(embed, reference);
        }
    });

    return matchedReferences;
};
