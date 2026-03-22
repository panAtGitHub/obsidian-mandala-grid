export const sanitizeFileName = (path: string, replacement = '-') => {
    const illegalCharacters = /[*"\\/<>:|?]/g;
    const unsafeCharactersForObsidianLinks = /[#^[\]|]/g;
    const dotAtTheStart = /^\./g;

    // credit: https://github.com/parshap/node-sanitize-filename/blob/209c39b914c8eb48ee27bcbde64b2c7822fdf3de/index.js#L33
    const replaceControlChars = (input: string) => {
        let output = '';
        for (const char of input) {
            const code = char.charCodeAt(0);
            const isControlChar =
                (code >= 0x00 && code <= 0x1f) ||
                (code >= 0x80 && code <= 0x9f);
            output += isControlChar ? replacement : char;
        }
        return output;
    };
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    const windowsTrailingRe = /[. ]+$/;

    let sanitized = path
        .replace(/"/g, "'")
        .replace(illegalCharacters, replacement)
        .replace(unsafeCharactersForObsidianLinks, replacement)
        .replace(dotAtTheStart, replacement)
        .replace(reservedRe, replacement)
        .replace(windowsReservedRe, replacement)
        .replace(windowsTrailingRe, replacement);
    sanitized = replaceControlChars(sanitized);

    if (replacement)
        sanitized = sanitized
            .replace(new RegExp(`${replacement}+`, 'g'), replacement)
            .replace(
                new RegExp(`^${replacement}(.)|(.)${replacement}$`, 'g'),
                '$1$2',
            );
    return sanitized.trim();
};
