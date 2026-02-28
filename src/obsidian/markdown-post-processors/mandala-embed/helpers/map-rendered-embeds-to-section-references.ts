import { type MarkdownSectionInformation } from 'obsidian';
import { type MandalaEmbedReferenceLike } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';

const EMBED_RE = /!\[\[([\s\S]+?)\]\]/gmu;

const getSectionKey = (section: MarkdownSectionInformation) =>
    `${section.lineStart}:${section.lineEnd}:${section.text}`;

const parseEmbedReferencesFromMarkdown = (markdown: string) => {
    const references: MandalaEmbedReferenceLike[] = [];

    let match: RegExpExecArray | null = null;
    while ((match = EMBED_RE.exec(markdown)) !== null) {
        const original = match[0];
        const inner = match[1]?.trim();
        if (!original || !inner) continue;

        const aliasIndex = inner.lastIndexOf('|');
        const link = aliasIndex >= 0 ? inner.slice(0, aliasIndex).trim() : inner;
        const displayText =
            aliasIndex >= 0 ? inner.slice(aliasIndex + 1).trim() : undefined;
        if (!link) continue;

        references.push({
            link,
            displayText,
            original,
        });
    }

    return references;
};

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
                parseEmbedReferencesFromMarkdown(section.text),
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
