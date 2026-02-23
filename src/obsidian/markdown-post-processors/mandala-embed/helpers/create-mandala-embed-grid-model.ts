import { getMandalaLayout } from 'src/view/helpers/mandala/mandala-grid';

const HEADING_RE = /^\s{0,3}#{1,6}\s+/;
const SECTION_COMMENT_RE = /<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->/gimu;

export type MandalaEmbedCellModel = {
    section: string;
    markdown: string;
    title: string;
    body: string;
    empty: boolean;
};

export type MandalaEmbedGridModel = {
    rows: MandalaEmbedCellModel[][];
};

type ParsedMandalaEmbedDocument = {
    sectionToContent: Record<string, string>;
    firstSection: string | null;
};

const normalizeCellPreviewText = (raw: string) =>
    raw
        .replace(/^\s*[-*+]\s+\[[ xX]\]\s*/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();

const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, Math.max(0, maxLength - 1)).trimEnd() + '…';
};

const toCellPreview = (content: string) => {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim() ?? '';
    const rest = lines.slice(1).join('\n');

    if (HEADING_RE.test(firstLine)) {
        const title = normalizeCellPreviewText(firstLine.replace(HEADING_RE, ''));
        const body = normalizeCellPreviewText(rest);
        return {
            title: truncate(title, 36),
            body: truncate(body, 180),
        };
    }

    const normalized = normalizeCellPreviewText(content);
    return {
        title: truncate(normalized, 48),
        body: '',
    };
};

const parseMandalaEmbedDocument = (
    markdown: string,
): ParsedMandalaEmbedDocument | null => {
    const matches = Array.from(markdown.matchAll(SECTION_COMMENT_RE));
    if (matches.length === 0) return null;

    const sectionToContent: Record<string, string> = {};
    for (let index = 0; index < matches.length; index += 1) {
        const current = matches[index];
        const section = current[1]?.trim();
        const start = (current.index ?? 0) + current[0].length;
        const end = matches[index + 1]?.index ?? markdown.length;
        if (!section) continue;

        const content = markdown
            .slice(start, end)
            .replace(/^\s*\r?\n/u, '')
            .trim();
        sectionToContent[section] = content;
    }

    return {
        sectionToContent,
        firstSection: matches[0]?.[1]?.trim() ?? null,
    };
};

const normalizeHeadingText = (value: string) =>
    value
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

const toHeadingAnchor = (value: string) =>
    normalizeHeadingText(value).replace(/\s+/g, '-');

const resolveSectionByCommentHeadingPairs = (
    markdown: string,
    headingSubpath: string,
) => {
    const normalizedTarget = normalizeHeadingText(headingSubpath);
    const targetAnchor = toHeadingAnchor(headingSubpath);
    const markerHeadingRe =
        /<!--\s*section:\s*(\d+(?:\.\d+)*)\s*-->\s*\r?\n\s*#{1,6}\s+(.+?)\s*#*\s*(?:\r?\n|$)/gmu;

    let matched: RegExpExecArray | null = null;
    while ((matched = markerHeadingRe.exec(markdown)) !== null) {
        const section = matched[1];
        const heading = matched[2];
        if (!section || !heading) continue;

        const normalizedHeading = normalizeHeadingText(heading);
        if (normalizedHeading === normalizedTarget) {
            return section;
        }
        if (toHeadingAnchor(heading) === targetAnchor) {
            return section;
        }
    }

    return null;
};

export const resolveMandalaSectionByHeading = (
    markdown: string,
    headingSubpath: string | null | undefined,
) => {
    const targetHeading = headingSubpath?.trim();
    if (!targetHeading) return null;

    return resolveSectionByCommentHeadingPairs(markdown, targetHeading);
};

const resolveCenterSection = (
    requestedCenterSection: string | null | undefined,
    parsed: ParsedMandalaEmbedDocument,
) => {
    if (
        requestedCenterSection &&
        Object.prototype.hasOwnProperty.call(
            parsed.sectionToContent,
            requestedCenterSection,
        )
    ) {
        return requestedCenterSection;
    }
    if (Object.prototype.hasOwnProperty.call(parsed.sectionToContent, '1')) {
        return '1';
    }

    return parsed.firstSection ?? '1';
};

export const createMandalaEmbedGridModel = (
    markdown: string,
    orientation: 'left-to-right' | 'south-start' | 'bottom-to-top',
    centerSection?: string | null,
): MandalaEmbedGridModel | null => {
    const parsed = parseMandalaEmbedDocument(markdown);
    if (!parsed) return null;
    const center = resolveCenterSection(centerSection, parsed);
    const layout = getMandalaLayout(orientation);
    const sectionRows = layout.themeGrid.map((row) =>
        row.map((slot) => (slot ? `${center}.${slot}` : center)),
    );

    const rows = sectionRows.map((row) =>
        row.map((section) => {
            const content = parsed.sectionToContent[section]?.trim() ?? '';
            const preview = toCellPreview(content);
            const empty = !preview.title && !preview.body;

            return {
                section,
                markdown: content,
                title: preview.title,
                body: preview.body,
                empty,
            };
        }),
    );

    return { rows };
};
