import { type EmbedCache, type MarkdownSectionInformation } from 'obsidian';

const getSectionKey = (section: MarkdownSectionInformation) =>
    `${section.lineStart}:${section.lineEnd}`;

const getCachedEmbedsInSection = (
    references: EmbedCache[],
    section: MarkdownSectionInformation,
) =>
    references
        .filter((reference) => {
            const line = reference.position.start.line;
            return line >= section.lineStart && line <= section.lineEnd;
        })
        .sort(
            (left, right) =>
                left.position.start.offset - right.position.start.offset,
        );

export const mapRenderedEmbedsToCache = (
    renderedEmbeds: HTMLElement[],
    references: EmbedCache[],
    getSectionInfo: (embed: HTMLElement) => MarkdownSectionInformation | null,
) => {
    const matchedReferences = new Map<HTMLElement, EmbedCache>();
    const sectionReferences = new Map<string, EmbedCache[]>();
    const sectionOffsets = new Map<string, number>();

    for (const embed of renderedEmbeds) {
        const section = getSectionInfo(embed);
        if (!section) continue;

        const key = getSectionKey(section);
        if (!sectionReferences.has(key)) {
            sectionReferences.set(
                key,
                getCachedEmbedsInSection(references, section),
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
