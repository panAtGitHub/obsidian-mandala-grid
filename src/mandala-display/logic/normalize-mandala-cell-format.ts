import type {
    MandalaCellFormatBody,
    MandalaCellFormatRule,
} from 'src/mandala-settings/state/frontmatter/mandala-cell-format';

export type CellFormatNormalizationResult =
    | { changed: boolean; content: string; skipped: false }
    | { changed: false; content: string; skipped: true; reason: string };

const HEADING_RE = /^(#{1,6})[ \t]+(.+?)\s*$/;
const UNORDERED_ITEM_RE = /^([-+*])[ \t]+(.+?)\s*$/;
const ORDERED_ITEM_RE = /^\d+[.)][ \t]+(.+?)\s*$/;

const splitBlocks = (lines: string[]) => {
    const blocks: string[][] = [];
    let current: string[] = [];
    for (const line of lines) {
        if (!line.trim()) {
            if (current.length) blocks.push(current);
            current = [];
            continue;
        }
        current.push(line);
    }
    if (current.length) blocks.push(current);
    return blocks;
};

const isComplexLine = (line: string) => {
    const trimmed = line.trim();
    return (
        !trimmed ||
        /^#{1,6}(?:[ \t]|$)/.test(trimmed) ||
        /^[-+*][ \t]/.test(trimmed) ||
        /^\d+[.)][ \t]/.test(trimmed) ||
        /^>/.test(trimmed) ||
        /^(```|~~~)/.test(trimmed) ||
        /^\|/.test(trimmed) ||
        /^!\[/.test(trimmed) ||
        /^!\[\[/.test(trimmed) ||
        /^<!--/.test(trimmed) ||
        /<!--|-->|\^\S+|\[\^[^\]]+\]/.test(trimmed) ||
        /^<[^>]+>/.test(trimmed)
    );
};

const parseSimpleBody = (
    lines: string[],
): {
    kind: 'paragraph' | 'unordered-list' | 'ordered-list';
    items: string[];
    sourceLines: string[];
} | null => {
    const flatLines = lines.filter((line) => line.trim().length > 0);
    if (flatLines.length === 0) {
        return { kind: 'paragraph', items: [], sourceLines: [] };
    }

    const unordered = flatLines.map((line) => UNORDERED_ITEM_RE.exec(line));
    if (unordered.every(Boolean)) {
        if (unordered.some((match) => match?.[2].startsWith('[ ]')))
            return null;
        if (unordered.some((match) => /^\[[xX]\]/.test(match?.[2] ?? '')))
            return null;
        return {
            kind: 'unordered-list',
            items: unordered.map((match) => match?.[2] ?? ''),
            sourceLines: flatLines,
        };
    }

    const ordered = flatLines.map((line) => ORDERED_ITEM_RE.exec(line));
    if (ordered.every(Boolean)) {
        if (ordered.some((match) => match?.[1].startsWith('[ ]'))) return null;
        if (ordered.some((match) => /^\[[xX]\]/.test(match?.[1] ?? '')))
            return null;
        return {
            kind: 'ordered-list',
            items: ordered.map((match) => match?.[1] ?? ''),
            sourceLines: flatLines,
        };
    }

    const blocks = splitBlocks(lines);
    if (blocks.some((block) => block.length !== 1)) return null;
    const paragraphLines = blocks.map((block) => block[0] ?? '');
    if (paragraphLines.some(isComplexLine)) return null;
    return {
        kind: 'paragraph',
        items: paragraphLines,
        sourceLines: flatLines,
    };
};

const renderBody = (
    parsed: NonNullable<ReturnType<typeof parseSimpleBody>>,
    body: MandalaCellFormatBody,
    prependTitle?: string,
) => {
    if (prependTitle && body !== 'paragraph' && parsed.kind === body) {
        if (body === 'ordered-list') {
            return [
                `1. ${prependTitle}`,
                ...parsed.items.map((item) => `1. ${item}`),
            ].join('\n');
        }
        const firstLine = parsed.sourceLines[0] ?? '';
        const prefix = `${firstLine.match(/^([-+*])[ \t]+/)?.[1] ?? '-'} `;
        return [`${prefix}${prependTitle}`, ...parsed.sourceLines].join('\n');
    }
    if (!prependTitle && body !== 'paragraph' && parsed.kind === body) {
        return parsed.sourceLines.join('\n');
    }
    if (body === 'paragraph') {
        const rendered = parsed.items.join('\n\n');
        return prependTitle
            ? [prependTitle, rendered].filter(Boolean).join('\n\n')
            : rendered;
    }
    const prefix = body === 'ordered-list' ? '1. ' : '- ';
    const renderedItems = parsed.items.map((item) => `${prefix}${item}`);
    return prependTitle
        ? [`${prefix}${prependTitle}`, ...renderedItems].join('\n')
        : renderedItems.join('\n');
};

const getHeadingAndBody = (
    content: string,
    heading: MandalaCellFormatRule['heading'],
) => {
    const lines = content.split(/\r?\n/);
    const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
    if (firstNonEmpty === -1) {
        return { title: null, bodyLines: [] as string[] };
    }

    const firstLine = lines[firstNonEmpty]?.trim() ?? '';
    const headingMatch = HEADING_RE.exec(firstLine);
    if (headingMatch) {
        return {
            title: headingMatch[2]?.trim() ?? '',
            bodyLines: lines.slice(firstNonEmpty + 1),
        };
    }

    if (heading === 'none') {
        return { title: null, bodyLines: lines.slice(firstNonEmpty) };
    }

    if (isComplexLine(firstLine)) return null;
    return {
        title: firstLine,
        bodyLines: lines.slice(firstNonEmpty + 1),
    };
};

export const normalizeDayPlanBody = (
    content: string,
    prefix: string | null,
    body: MandalaCellFormatBody,
): CellFormatNormalizationResult => {
    const skip = {
        content,
        changed: false,
        skipped: true,
        reason: '无法安全识别日计划正文',
    } as const;
    if (prefix === null) return skip;
    const original = content.slice(prefix.length);
    if (!original.trim()) return { content, changed: false, skipped: false };
    const lines = original.split(/\r?\n/);
    // Indented, thematic-break and setext lines can change block structure when a marker is removed.
    const unsafe = (line: string) =>
        /^(?:[ \t]+\S|\s*(?:[-*_][\s*_-]*|=+|\[[^\]]+\]:.*)\s*$)/.test(line);
    if (lines.some(unsafe)) return skip;
    const parsed = parseSimpleBody(lines);
    if (!parsed) return skip;
    if (parsed.kind === body)
        return { content, changed: false, skipped: false };
    if (
        parsed.items.some(
            (item) =>
                unsafe(item) ||
                isComplexLine(item) ||
                /^\[[^\]]\](?:\s|$)/.test(item),
        )
    )
        return skip;
    const eol = content.includes('\r\n') ? '\r\n' : '\n';
    const result =
        body === 'ordered-list'
            ? parsed.items.map((item, i) => `${i + 1}. ${item}`).join(eol)
            : renderBody(parsed, body).replace(/\n/g, eol);
    return { content: prefix + result, changed: true, skipped: false };
};

export const normalizeMandalaCellFormatContent = (
    content: string,
    rule: MandalaCellFormatRule,
): CellFormatNormalizationResult => {
    if (!content.trim()) return { changed: false, content, skipped: false };
    const parsedHeading = getHeadingAndBody(content, rule.heading);
    if (!parsedHeading) {
        return {
            changed: false,
            content,
            skipped: true,
            reason: '无法安全识别标题或正文块',
        };
    }

    const parsedBody = parseSimpleBody(parsedHeading.bodyLines);
    if (!parsedBody) {
        return {
            changed: false,
            content,
            skipped: true,
            reason: '正文包含嵌套列表或复杂 Markdown',
        };
    }

    const title = parsedHeading.title;
    if (
        rule.body === 'paragraph' &&
        ((parsedBody.kind !== 'paragraph' &&
            parsedBody.items.some(isComplexLine)) ||
            (title && rule.heading === 'none' && isComplexLine(title)))
    ) {
        return {
            changed: false,
            content,
            skipped: true,
            reason: '列表项转换为段落后会改变 Markdown 结构',
        };
    }
    const renderedBody = renderBody(
        parsedBody,
        rule.body,
        title && rule.heading === 'none' ? title : undefined,
    );
    const renderedHeading =
        title && rule.heading !== 'none'
            ? `${'#'.repeat(rule.heading)} ${title}`
            : '';
    const nextContent = renderedHeading
        ? renderedBody
            ? `${renderedHeading}\n${renderedBody}`
            : renderedHeading
        : renderedBody;
    return {
        changed: nextContent !== content,
        content: nextContent,
        skipped: false,
    };
};
