export type ParsedMandalaEmbedSrc = {
    linktext: string;
    centerSection: string | null;
};

const SECTION_RE = /^\d+(?:\.\d+)*$/;

const isValidSection = (value: string) => SECTION_RE.test(value);

export const parseMandalaEmbedSrc = (
    src: string | null,
): ParsedMandalaEmbedSrc | null => {
    if (!src) return null;

    const trimmed = src.trim();
    if (!trimmed) return null;

    const dollarIndex = trimmed.lastIndexOf('$');
    if (dollarIndex <= 0 || dollarIndex >= trimmed.length - 1) {
        return {
            linktext: trimmed,
            centerSection: null,
        };
    }

    const linktext = trimmed.slice(0, dollarIndex).trim();
    const candidate = trimmed.slice(dollarIndex + 1).trim();

    if (!linktext || !isValidSection(candidate)) {
        return {
            linktext: trimmed,
            centerSection: null,
        };
    }

    return {
        linktext,
        centerSection: candidate,
    };
};

