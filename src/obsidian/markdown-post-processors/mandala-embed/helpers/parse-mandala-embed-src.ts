export type ParsedMandalaEmbedSrc = {
    linktext: string;
    centerSection: string | null;
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

const parseTrailingMarker = (value: string) => {
    if (value.endsWith('$')) {
        const linktext = safeDecodeUriComponent(value.slice(0, -1)).trim();
        return linktext ? { linktext, centerSection: null } : null;
    }
    if (/^(.*)%24$/iu.test(value)) {
        const stripped = safeDecodeUriComponent(
            value.replace(/%24$/iu, ''),
        ).trim();
        return stripped ? { linktext: stripped, centerSection: null } : null;
    }
    return null;
};

const parseSectionMarker = (value: string) => {
    const dollarMatch = value.match(/^(.*)\$(\d+(?:\.\d+)*)$/u);
    if (dollarMatch?.[1] && dollarMatch[2]) {
        const linktext = safeDecodeUriComponent(dollarMatch[1]).trim();
        const centerSection = dollarMatch[2].trim();
        if (linktext && centerSection) {
            return { linktext, centerSection };
        }
    }

    const encodedMatch = value.match(/^(.*)%24(\d+(?:\.\d+)*)$/iu);
    if (encodedMatch?.[1] && encodedMatch[2]) {
        const linktext = safeDecodeUriComponent(encodedMatch[1]).trim();
        const centerSection = encodedMatch[2].trim();
        if (linktext && centerSection) {
            return { linktext, centerSection };
        }
    }

    return null;
};

export const parseMandalaEmbedSrc = (
    src: string | null,
): ParsedMandalaEmbedSrc | null => {
    if (!src) return null;

    const trimmed = src.trim();
    if (!trimmed) return null;

    for (const candidate of decodeCandidates(trimmed)) {
        const sectionMarker = parseSectionMarker(candidate);
        if (sectionMarker) return sectionMarker;

        const trailingMarker = parseTrailingMarker(candidate);
        if (trailingMarker) return trailingMarker;
    }

    return null;
};
