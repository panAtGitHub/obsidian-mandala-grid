import { extractEmbedReferencesFromMarkdown } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/extract-embed-references-from-markdown';
import { type MandalaEmbedReferenceLike } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';

export const mapRenderedEmbedsToDocumentReferences = (
    renderedEmbeds: HTMLElement[],
    markdown: string,
    getEmbedKey: (embed: HTMLElement) => string | null,
    getReferenceKey: (reference: MandalaEmbedReferenceLike) => string | null,
) => {
    const matchedReferences = new Map<HTMLElement, MandalaEmbedReferenceLike>();
    const referencesByKey = new Map<string, MandalaEmbedReferenceLike[]>();

    for (const reference of extractEmbedReferencesFromMarkdown(markdown)) {
        const key = getReferenceKey(reference);
        if (!key) continue;

        const matches = referencesByKey.get(key) ?? [];
        matches.push(reference);
        referencesByKey.set(key, matches);
    }

    for (const embed of renderedEmbeds) {
        const key = getEmbedKey(embed);
        if (!key) continue;

        const matches = referencesByKey.get(key);
        const reference = matches?.shift();
        if (reference) {
            matchedReferences.set(embed, reference);
        }
    }

    return matchedReferences;
};
