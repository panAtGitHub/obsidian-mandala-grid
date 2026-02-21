import { parseHtmlCommentMarker } from 'src/lib/data-conversion/helpers/html-comment-marker/parse-html-comment-marker';

type SectionRange = {
    markerLine: number;
    nextMarkerLine: number;
    section: string;
};

const findSectionRange = (
    markdown: string,
    section: string,
): SectionRange | null => {
    const lines = markdown.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const marker = parseHtmlCommentMarker(lines[i]);
        if (!marker || marker[2] !== section) continue;
        let nextMarkerLine = lines.length;
        for (let j = i + 1; j < lines.length; j++) {
            if (parseHtmlCommentMarker(lines[j])) {
                nextMarkerLine = j;
                break;
            }
        }
        return {
            markerLine: i,
            nextMarkerLine,
            section,
        };
    }
    return null;
};

export const getSectionContentBySection = (
    markdown: string,
    section: string,
): string | null => {
    const range = findSectionRange(markdown, section);
    if (!range) return null;
    const lines = markdown.split('\n');
    return lines.slice(range.markerLine + 1, range.nextMarkerLine).join('\n');
};

export const applySectionPatch = (
    markdown: string,
    section: string,
    replacement: string,
) => {
    const range = findSectionRange(markdown, section);
    if (!range) return null;

    const lines = markdown.split('\n');
    const replacementLines =
        replacement.length > 0 ? replacement.split('\n') : [];
    const patched = [
        ...lines.slice(0, range.markerLine + 1),
        ...replacementLines,
        ...lines.slice(range.nextMarkerLine),
    ];
    const lineForJump =
        replacementLines.length > 0
            ? range.markerLine + replacementLines.length
            : range.markerLine;

    return {
        markdown: patched.join('\n'),
        lineForJump,
    };
};
