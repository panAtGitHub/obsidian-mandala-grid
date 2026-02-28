export type MandalaEmbedReferenceLike = {
    link: string;
    displayText?: string;
    original: string;
};

export type ParsedMandalaEmbedReference = {
    linktext: string;
};

const splitLinktext = (linktext: string) => {
    const hashIndex = linktext.lastIndexOf('#');
    if (hashIndex <= 0) {
        return {
            path: linktext.trim(),
            subpath: '',
        };
    }

    return {
        path: linktext.slice(0, hashIndex).trim(),
        subpath: linktext.slice(hashIndex + 1).trim(),
    };
};

export const parseMandalaEmbedReference = (
    reference: MandalaEmbedReferenceLike | null,
): ParsedMandalaEmbedReference | null => {
    if (!reference) return null;

    if (reference.displayText?.trim() !== '$') return null;

    const linktext = reference.link.trim();
    if (!linktext) return null;

    const { path, subpath } = splitLinktext(linktext);
    const normalizedSubpath = subpath?.trim().replace(/^#+/u, '') ?? '';
    if (!path || !normalizedSubpath) return null;
    if (normalizedSubpath.startsWith('^')) return null;
    if (normalizedSubpath.endsWith('$')) return null;

    return { linktext };
};
