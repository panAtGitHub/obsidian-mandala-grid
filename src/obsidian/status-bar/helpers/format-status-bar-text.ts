import { StatusSummary } from 'src/obsidian/status-bar/helpers/status-bar-summary';

export const formatStatusBarText = (summary: StatusSummary) => {
    return `sections: ${summary.nonEmptySections} | words: ${summary.currentSectionChars} / ${summary.totalChars}`;
};
