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
    if (withMarker) {
        const stripped = withMarker.endsWith('$')
            ? withMarker.slice(0, -1)
            : withMarker.slice(0, -3);
        const linktext = safeDecodeUriComponent(stripped).trim();
        if (!linktext) return null;

        return {
            linktext,
            centerSection: null,
        };
    }

    const normalized = safeDecodeUriComponent(trimmed);
    const markerIndex = normalized.lastIndexOf('$');
    if (markerIndex <= 0 || markerIndex >= normalized.length - 1) {
        return null;
    }

    const linktext = normalized.slice(0, markerIndex).trim();
    const centerSection = normalized.slice(markerIndex + 1).trim();
    if (!linktext || !centerSection) return null;
    if (!/^\d+(?:\.\d+)*$/u.test(centerSection)) return null;

    return {
        linktext,
        centerSection,
    };
};
