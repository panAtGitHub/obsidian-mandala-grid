import {
    ParsedMandalaSection,
    ParsedMandalaSections,
} from 'src/mandala-document/engine/types';

const SECTION_MARKER_RE = /<!--\s*section:\s*([0-9]+(?:\.[0-9]+)*)\s*-->/g;
const encoder = new TextEncoder();

const normalizeSectionContent = (raw: string) => {
    let normalized = raw;
    if (normalized.startsWith('\r\n')) {
        normalized = normalized.slice(2);
    } else if (normalized.startsWith('\n')) {
        normalized = normalized.slice(1);
    }
    if (normalized.endsWith('\r\n')) {
        normalized = normalized.slice(0, -2);
    } else if (normalized.endsWith('\n')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
};

export const parseSections = (markdown: string): ParsedMandalaSections => {
    const sourceBytes = encoder.encode(markdown).length;
    const matches: ParsedMandalaSection[] = [];
    for (const match of markdown.matchAll(SECTION_MARKER_RE)) {
        const id = match[1]?.trim();
        const marker = match[0];
        const index = match.index ?? -1;
        if (!id || !marker || index < 0) continue;
        matches.push({
            id,
            content: '',
            markerStart: index,
            markerEnd: index + marker.length,
        });
    }

    if (matches.length === 0) {
        return { sections: [], sourceBytes };
    }

    for (let i = 0; i < matches.length; i += 1) {
        const current = matches[i];
        const nextStart = matches[i + 1]?.markerStart ?? markdown.length;
        const rawContent = markdown.slice(current.markerEnd, nextStart);
        current.content = normalizeSectionContent(rawContent);
    }

    return {
        sections: matches,
        sourceBytes,
    };
};
