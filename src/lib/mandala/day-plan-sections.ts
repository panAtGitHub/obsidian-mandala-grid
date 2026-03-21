import { parseSectionMarker } from 'src/engine/mandala-document/parse-section-marker';

const findSectionIndex = (lines: string[], section: string) => {
    for (let i = 0; i < lines.length; i += 1) {
        const parsed = parseSectionMarker(lines[i]);
        if (parsed?.[2] === section) return i;
    }
    return -1;
};

const findNextSectionIndex = (lines: string[], start: number) => {
    for (let i = start; i < lines.length; i += 1) {
        if (parseSectionMarker(lines[i])) return i;
    }
    return -1;
};

export const getSectionContent = (body: string, section: string) => {
    const lines = body.split('\n');
    const startIndex = findSectionIndex(lines, section);
    if (startIndex === -1) return null;
    const endIndex = findNextSectionIndex(lines, startIndex + 1);
    const contentLines =
        endIndex === -1
            ? lines.slice(startIndex + 1)
            : lines.slice(startIndex + 1, endIndex);
    return contentLines.join('\n');
};

export const replaceSectionContent = (
    body: string,
    section: string,
    content: string,
) => {
    const lines = body.split('\n');
    const startIndex = findSectionIndex(lines, section);
    if (startIndex === -1) return body;
    const endIndex = findNextSectionIndex(lines, startIndex + 1);
    const contentLines = content ? content.split('\n') : [''];
    const deleteCount =
        endIndex === -1 ? lines.length - startIndex - 1 : endIndex - startIndex - 1;
    lines.splice(startIndex + 1, deleteCount, ...contentLines);
    return lines.join('\n');
};

export const ensureSectionChildren = (
    body: string,
    section: string,
    count: number,
) => {
    const lines = body.split('\n');
    const startIndex = findSectionIndex(lines, section);
    if (startIndex === -1) return body;

    const endIndex = (() => {
        for (let i = startIndex + 1; i < lines.length; i += 1) {
            const parsed = parseSectionMarker(lines[i]);
            if (!parsed) continue;
            const full = parsed[2];
            if (!full.startsWith(`${section}.`)) {
                return i;
            }
        }
        return lines.length;
    })();

    const existing = new Map<number, number>();
    for (let i = startIndex + 1; i < endIndex; i += 1) {
        const parsed = parseSectionMarker(lines[i]);
        if (!parsed) continue;
        const full = parsed[2];
        if (!full.startsWith(`${section}.`)) continue;
        const suffix = full.slice(section.length + 1);
        if (suffix.includes('.')) continue;
        const index = Number(suffix);
        if (!Number.isNaN(index)) existing.set(index, i);
    }

    const insertions = new Map<number, string[]>();
    for (let i = 1; i <= count; i += 1) {
        if (existing.has(i)) continue;
        let insertAt = endIndex;
        for (let next = i + 1; next <= count; next += 1) {
            const nextIndex = existing.get(next);
            if (nextIndex !== undefined) {
                insertAt = nextIndex;
                break;
            }
        }
        if (!insertions.has(insertAt)) insertions.set(insertAt, []);
        insertions.get(insertAt)!.push(`<!--section: ${section}.${i}-->`, '');
    }

    const insertionPoints = Array.from(insertions.keys()).sort((a, b) => b - a);
    for (const index of insertionPoints) {
        const block = insertions.get(index);
        if (!block || block.length === 0) continue;
        lines.splice(index, 0, ...block);
    }

    return lines.join('\n');
};
