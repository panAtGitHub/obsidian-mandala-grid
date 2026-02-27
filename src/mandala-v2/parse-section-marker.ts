export type ParsedSectionMarker = [parent: string, index: string, section: string];

const SECTION_MARKER_LINE_RE =
    /^\s*<!--\s*section:\s*([0-9]+(?:\.[0-9]+)*)\s*-->/;

export const parseSectionMarker = (
    line: string,
): ParsedSectionMarker | undefined => {
    const match = SECTION_MARKER_LINE_RE.exec(line);
    const section = match?.[1];
    if (!section) return;

    const parts = section.split('.');
    const index = parts[parts.length - 1];
    const parent =
        parts.length > 1 ? parts.slice(0, parts.length - 1).join('.') : '';
    return [parent, index, section];
};
