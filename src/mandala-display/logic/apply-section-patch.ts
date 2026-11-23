import { parseSectionMarker } from 'src/mandala-document/engine/parse-section-marker';

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
        const marker = parseSectionMarker(lines[i]);
        if (!marker || marker[2] !== section) continue;
        let nextMarkerLine = lines.length;
        for (let j = i + 1; j < lines.length; j++) {
            if (parseSectionMarker(lines[j])) {
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
    const marker = lines[range.markerLine];
    const inline = marker.slice(marker.indexOf('-->') + 3);
    const body = lines.slice(range.markerLine + 1, range.nextMarkerLine);
    if (inline.trim()) body.unshift(inline);
    return body.join('\n');
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
    const marker = lines[range.markerLine];
    const end = marker.indexOf('-->') + 3;
    const inline = !!marker.slice(end).trim();
    const patched = [
        ...lines.slice(0, range.markerLine),
        inline ? marker.slice(0, end) + (replacementLines[0] ?? '') : marker,
        ...(inline ? replacementLines.slice(1) : replacementLines),
        ...lines.slice(range.nextMarkerLine),
    ];
    const lineForJump =
        replacementLines.length > 0
            ? range.markerLine + replacementLines.length - Number(inline)
            : range.markerLine;

    return {
        markdown: patched.join('\n'),
        lineForJump,
    };
};
