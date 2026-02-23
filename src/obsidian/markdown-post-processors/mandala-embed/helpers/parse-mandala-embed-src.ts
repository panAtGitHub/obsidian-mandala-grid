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

export const parseMandalaEmbedSrc = (
    src: string | null,
): ParsedMandalaEmbedSrc | null => {
    if (!src) return null;

    const trimmed = src.trim();
    if (!trimmed) return null;
    const decoded = safeDecodeUriComponent(trimmed);

    const withMarker = [trimmed, decoded].find(
        (value) => value.endsWith('$') || value.endsWith('%24'),
    );
    if (!withMarker) return null;

    const stripped = withMarker.endsWith('$')
        ? withMarker.slice(0, -1)
        : withMarker.slice(0, -3);
    const linktext = safeDecodeUriComponent(stripped).trim();
    if (!linktext) return null;

    return {
        linktext,
    };
};
