export type ParsedMandalaEmbedSrc = {
    linktext: string;
};

const safeDecodeUriComponent = (value: string) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const decodeCandidates = (value: string) => {
    const first = safeDecodeUriComponent(value);
    const second = safeDecodeUriComponent(first);
    const third = safeDecodeUriComponent(second);
    return Array.from(new Set([value, first, second, third]));
};

const toHeadingMarkerLinktext = (value: string) => {
    if (value.endsWith('$')) {
        return safeDecodeUriComponent(value.slice(0, -1)).trim();
    }
    if (/^(.*)%24$/iu.test(value)) {
        return safeDecodeUriComponent(value.replace(/%24$/iu, '')).trim();
    }
    return null;
};

const hasHeadingSubpath = (linktext: string) => {
    const hashIndex = linktext.lastIndexOf('#');
    if (hashIndex <= 0) return false;

    const path = linktext.slice(0, hashIndex).trim();
    const heading = linktext.slice(hashIndex + 1).trim();
    if (!path || !heading) return false;
    if (heading.startsWith('^')) return false;
    return true;
};

export const parseMandalaEmbedSrc = (
    src: string | null,
): ParsedMandalaEmbedSrc | null => {
    if (!src) return null;

    const trimmed = src.trim();
    if (!trimmed) return null;

    for (const candidate of decodeCandidates(trimmed)) {
        const linktext = toHeadingMarkerLinktext(candidate);
        if (!linktext) continue;
        if (!hasHeadingSubpath(linktext)) continue;
        return { linktext };
    }

    return null;
};
