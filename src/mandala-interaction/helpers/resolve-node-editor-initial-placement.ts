export type NodeEditorCursorPosition = {
    line: number;
    ch: number;
};

export type NodeEditorInitialPlacement = {
    content: string;
    cursor: NodeEditorCursorPosition;
    generatedCellFormat?: {
        headingPrefix: string | null;
        bodyPrefix: string | null;
    };
};

type CellFormatRule = {
    heading: 1 | 2 | 3 | 4 | 5 | 6 | 'none';
    body: 'paragraph' | 'unordered-list' | 'ordered-list';
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

const getBodyPrefix = (body: CellFormatRule['body']) => {
    if (body === 'unordered-list') return '- ';
    if (body === 'ordered-list') return '1. ';
    return null;
};

const createCellFormatPlacement = (
    rule: CellFormatRule,
): NodeEditorInitialPlacement => {
    const headingPrefix =
        rule.heading === 'none' ? null : `${'#'.repeat(rule.heading)} `;
    const bodyPrefix = getBodyPrefix(rule.body);
    const lines: string[] = [];
    if (headingPrefix) lines.push(headingPrefix);
    if (bodyPrefix) lines.push(bodyPrefix);
    if (headingPrefix && !bodyPrefix) lines.push('');
    const cursorCh = headingPrefix?.length ?? bodyPrefix?.length ?? 0;
    return {
        content: lines.join('\n'),
        cursor: { line: 0, ch: cursorCh },
        generatedCellFormat: { headingPrefix, bodyPrefix },
    };
};

const normalizeGeneratedCellFormatContent = (
    content: string,
    generatedCellFormat: NonNullable<
        NodeEditorInitialPlacement['generatedCellFormat']
    >,
) => {
    const lines = splitLines(content);
    let removedGeneratedHeading = false;
    if (
        generatedCellFormat.headingPrefix &&
        lines[0] === generatedCellFormat.headingPrefix
    ) {
        lines.shift();
        removedGeneratedHeading = true;
        while (lines.length > 0 && !lines[0]?.trim()) lines.shift();
    }
    if (!generatedCellFormat.headingPrefix && !generatedCellFormat.bodyPrefix) {
        return lines.some((line) => line.trim()) ? lines.join('\n') : '';
    }
    let lastNonEmptyLine = lines.length - 1;
    while (lastNonEmptyLine >= 0 && !lines[lastNonEmptyLine]?.trim()) {
        lastNonEmptyLine -= 1;
    }
    if (
        generatedCellFormat.bodyPrefix &&
        lastNonEmptyLine >= 0 &&
        lines[lastNonEmptyLine] === generatedCellFormat.bodyPrefix
    ) {
        lines.splice(lastNonEmptyLine, 1);
        while (lines.length > 0 && !lines[lines.length - 1]?.trim()) {
            lines.pop();
        }
    } else if (generatedCellFormat.headingPrefix || removedGeneratedHeading) {
        while (lines.length > 0 && !lines[lines.length - 1]?.trim()) {
            lines.pop();
        }
    }
    return lines.join('\n');
};

export const resolveNodeEditorInitialPlacement = ({
    content,
    isDayPlanScene,
    historyCursor,
    cellFormat,
}: {
    content: string;
    isDayPlanScene: boolean;
    historyCursor?: NodeEditorCursorPosition | null;
    cellFormat?: CellFormatRule;
}): NodeEditorInitialPlacement => {
    const lines = splitLines(content);
    const firstNonEmptyLine = findFirstNonEmptyLineIndex(lines);
    const dayPlanHeadingLine =
        isDayPlanScene &&
        firstNonEmptyLine !== -1 &&
        isMarkdownHeading(lines[firstNonEmptyLine] ?? '')
            ? firstNonEmptyLine
            : null;

    if (dayPlanHeadingLine !== null) {
        const lastBodyLine = findLastNonEmptyLineIndex(
            lines,
            dayPlanHeadingLine,
        );
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
            dayPlanHeadingLine,
        );

        return {
            content: normalizedContent,
            cursor: {
                line: dayPlanHeadingLine + 1,
                ch: 0,
            },
        };
    }

    if (cellFormat && content.trim().length === 0) {
        return createCellFormatPlacement(cellFormat);
    }

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
    generatedCellFormat,
}: {
    currentContent: string;
    originalContent: string;
    preparedContent: string;
    generatedCellFormat?: NodeEditorInitialPlacement['generatedCellFormat'];
}) => {
    const normalizedContent = generatedCellFormat
        ? normalizeGeneratedCellFormatContent(
              currentContent,
              generatedCellFormat,
          )
        : currentContent;
    if (
        originalContent !== preparedContent &&
        (normalizedContent === originalContent ||
            normalizedContent === preparedContent)
    ) {
        return originalContent;
    }
    return normalizedContent;
};
