import { type MandalaEmbedReferenceLike } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';

const EMBED_RE = /!\[\[([\s\S]+?)\]\]/gmu;

export const extractEmbedReferencesFromMarkdown = (markdown: string) => {
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
