export type ParsedMandalaEmbedSrc = {
    linktext: string;
};

export const parseMandalaEmbedSrc = (
    src: string | null,
): ParsedMandalaEmbedSrc | null => {
    if (!src) return null;

    const trimmed = src.trim();
    if (!trimmed) return null;
    if (!trimmed.endsWith('$')) return null;

    const linktext = trimmed.slice(0, -1).trim();
    if (!linktext) return null;

    return {
        linktext,
    };
};
