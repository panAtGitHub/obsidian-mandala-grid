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

export const doesSelectionTouchMandalaSourceEmbedLine = (
    selectionRanges: SelectionRangeLike[],
    lineFrom: number,
    lineTo: number,
) =>
    selectionRanges.some((selection) => {
        if (selection.from === selection.to) {
            return selection.from >= lineFrom && selection.to <= lineTo;
        }

        return selection.from <= lineTo && selection.to >= lineFrom;
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
    const lineFrom = from - textBeforeMatch.length;
    const lineTo = to + textAfterMatch.length;
    if (doesSelectionTouchMandalaSourceEmbedLine(selectionRanges, lineFrom, lineTo)) {
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
