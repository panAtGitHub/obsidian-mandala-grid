export type StatusSummary = {
    nonEmptySections: number;
    currentSectionChars: number;
    totalChars: number;
};

export const normalizeCharsCount = (text: string | undefined) => {
    if (!text) return 0;
    return text.replace(/\s+/g, '').length;
};

export const calculateStatusSummary = (
    texts: string[],
    activeText: string,
): StatusSummary => {
    let nonEmptySections = 0;
    let totalChars = 0;

    for (const text of texts) {
        if (text.trim().length > 0) {
            nonEmptySections += 1;
        }
        totalChars += normalizeCharsCount(text);
    }

    return {
        nonEmptySections,
        currentSectionChars: normalizeCharsCount(activeText),
        totalChars,
    };
};
