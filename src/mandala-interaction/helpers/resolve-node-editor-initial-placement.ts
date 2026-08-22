export type NodeEditorCursorPosition = {
    line: number;
    ch: number;
};

export type NodeEditorInitialPlacement = {
    content: string;
    cursor: NodeEditorCursorPosition;
};

const splitLines = (content: string) => content.split(/\r?\n/);

const getContentEndCursor = (
    content: string,
): NodeEditorInitialPlacement['cursor'] => {
    const lines = splitLines(content);
    const line = Math.max(0, lines.length - 1);
    return {
        line,
        ch: lines[line]?.length ?? 0,
    };
};

const isCursorInRange = (
    cursor: NodeEditorCursorPosition,
    content: string,
): boolean => {
    if (cursor.line < 0 || cursor.ch < 0) return false;
    const lines = splitLines(content);
    const lastLine = Math.max(0, lines.length - 1);
    if (cursor.line > lastLine) return false;
    return cursor.ch <= (lines[cursor.line]?.length ?? 0);
};

const findFirstNonEmptyLineIndex = (lines: string[]) =>
    lines.findIndex((line) => line.trim().length > 0);

const findLastNonEmptyLineIndex = (lines: string[], afterLine: number) => {
    for (let index = lines.length - 1; index > afterLine; index -= 1) {
        if ((lines[index] ?? '').trim().length > 0) {
            return index;
        }
    }
    return -1;
};

const isMarkdownHeading = (line: string) => /^#{1,6}\s+/.test(line.trim());

const ensureNextBodyLine = (
    content: string,
    lines: string[],
    headingLine: number,
) => {
    if (headingLine + 1 < lines.length) {
        return content;
    }
    return `${content}\n`;
};

const resolveDayPlanPlacement = (
    content: string,
): NodeEditorInitialPlacement | null => {
    const lines = splitLines(content);
    const firstNonEmptyLine = findFirstNonEmptyLineIndex(lines);
    if (
        firstNonEmptyLine === -1 ||
        !isMarkdownHeading(lines[firstNonEmptyLine] ?? '')
    ) {
        return null;
    }

    const lastBodyLine = findLastNonEmptyLineIndex(lines, firstNonEmptyLine);
    if (lastBodyLine !== -1) {
        return {
            content,
            cursor: {
                line: lastBodyLine,
                ch: lines[lastBodyLine]?.length ?? 0,
            },
        };
    }

    const normalizedContent = ensureNextBodyLine(
        content,
        lines,
        firstNonEmptyLine,
    );

    return {
        content: normalizedContent,
        cursor: {
            line: firstNonEmptyLine + 1,
            ch: 0,
        },
    };
};

export const resolveNodeEditorInitialPlacement = ({
    content,
    isDayPlanScene,
    historyCursor,
}: {
    content: string;
    isDayPlanScene: boolean;
    historyCursor?: NodeEditorCursorPosition | null;
}): NodeEditorInitialPlacement => {
    // Day-plan editing has a deterministic business rule and intentionally
    // does not restore the previous cursor position:
    // 1. heading-only / blank body -> first line directly below the heading;
    // 2. existing body -> end of the last non-empty body line.
    if (isDayPlanScene) {
        const dayPlanPlacement = resolveDayPlanPlacement(content);
        if (dayPlanPlacement) return dayPlanPlacement;
    }

    // Keep the existing generic editor behaviour outside a valid day-plan
    // section: restore a valid historical cursor before falling back to EOF.
    if (historyCursor && isCursorInRange(historyCursor, content)) {
        return {
            content,
            cursor: historyCursor,
        };
    }

    return {
        content,
        cursor: getContentEndCursor(content),
    };
};

export const resolveNodeEditorCommitContent = ({
    currentContent,
    originalContent,
    preparedContent,
}: {
    currentContent: string;
    originalContent: string;
    preparedContent: string;
}) => {
    if (
        originalContent !== preparedContent &&
        currentContent === preparedContent
    ) {
        return originalContent;
    }
    return currentContent;
};
