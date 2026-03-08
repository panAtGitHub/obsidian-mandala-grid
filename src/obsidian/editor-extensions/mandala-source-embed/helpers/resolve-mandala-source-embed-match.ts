import { extractEmbedReferencesFromMarkdown } from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/extract-embed-references-from-markdown';
import {
    parseMandalaEmbedReference,
    type MandalaEmbedReferenceLike,
    type ParsedMandalaEmbedReference,
} from 'src/obsidian/markdown-post-processors/mandala-embed/helpers/parse-mandala-embed-reference';

type SelectionRangeLike = {
    from: number;
    to: number;
};

export type ResolvedMandalaSourceEmbedMatch = {
    reference: MandalaEmbedReferenceLike;
    parsedReference: ParsedMandalaEmbedReference;
};

export const doesSelectionTouchMandalaSourceEmbedRange = (
    selectionRanges: SelectionRangeLike[],
    from: number,
    to: number,
) =>
    selectionRanges.some((selection) => {
        if (selection.from === selection.to) {
            return selection.from > from && selection.to < to;
        }

        return selection.from < to && selection.to > from;
    });

export const resolveMandalaSourceEmbedMatch = ({
    matchText,
    from,
    to,
    textBeforeMatch,
    textAfterMatch,
    selectionRanges,
}: {
    matchText: string;
    from: number;
    to: number;
    textBeforeMatch: string;
    textAfterMatch: string;
    selectionRanges: SelectionRangeLike[];
}): ResolvedMandalaSourceEmbedMatch | null => {
    if (textBeforeMatch.trim().length > 0) return null;
    if (textAfterMatch.trim().length > 0) return null;
    if (doesSelectionTouchMandalaSourceEmbedRange(selectionRanges, from, to)) {
        return null;
    }

    const reference = extractEmbedReferencesFromMarkdown(matchText)[0] ?? null;
    if (!reference) return null;

    const parsedReference = parseMandalaEmbedReference(reference);
    if (!parsedReference) return null;

    return {
        reference,
        parsedReference,
    };
};
