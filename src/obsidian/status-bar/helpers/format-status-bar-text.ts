type StatusSummary = {
    nonEmptySections: number;
    currentSectionChars: number;
    totalChars: number;
};

export const formatStatusBarText = (summary: StatusSummary) => {
    return `sections: ${summary.nonEmptySections} | words: ${summary.currentSectionChars} / ${summary.totalChars}`;
};
