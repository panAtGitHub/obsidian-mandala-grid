export type SimpleSummaryActiveCell = {
    row: number;
    col: number;
} | null;

export type SimpleSummaryCellModel = {
    row: number;
    col: number;
    section: string | null;
    titleMarkdown: string;
    bodyMarkdown: string;
    nodeId: string;
    isCenter: boolean;
    isThemeCenter: boolean;
    isGrayBlock: boolean;
    background: string | null;
    textTone: 'dark' | 'light' | null;
    style: string | null;
};
