const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

const HAS_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

export const isSafeExternalUrl = (url: string): boolean => {
    const value = url.trim();
    if (!value || !HAS_SCHEME_RE.test(value)) {
        return false;
    }

    try {
        const parsed = new URL(value);
        return SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol.toLowerCase());
    } catch {
        return false;
    }
};
