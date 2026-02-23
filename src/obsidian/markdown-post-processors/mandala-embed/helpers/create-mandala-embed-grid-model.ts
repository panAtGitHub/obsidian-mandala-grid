import { htmlCommentToJson } from 'src/lib/data-conversion/x-to-json/html-comment-to-json';
import { htmlElementToJson } from 'src/lib/data-conversion/x-to-json/html-element-to-json';
import { jsonToColumns } from 'src/lib/data-conversion/json-to-x/json-to-columns';
import { outlineToJson } from 'src/lib/data-conversion/x-to-json/outline-to-json';
import { detectDocumentFormat } from 'src/lib/format-detection/detect-document-format';
import { isMandalaFrontmatterEnabled } from 'src/lib/mandala/mandala-profile';
import { calculateMandalaTreeIndexes } from 'src/stores/view/subscriptions/helpers/calculate-tree-index';
import type { MandalaGridDocumentFormat } from 'src/stores/settings/settings-type';
import { getMandalaLayout } from 'src/view/helpers/mandala/mandala-grid';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';

const HEADING_RE = /^\s{0,3}#{1,6}\s+/;

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
    document: ReturnType<typeof jsonToColumns>;
    sections: ReturnType<typeof calculateMandalaTreeIndexes>;
};

const isMandalaDocument = (frontmatter: string, body: string) => {
    if (isMandalaFrontmatterEnabled(frontmatter)) {
        return true;
    }

    const hasCommentCore = /<!--\s*section:\s*1(?:\s|--)/i.test(body);
    const hasCommentChild = /<!--\s*section:\s*1\.[1-8]\b/i.test(body);
    if (hasCommentCore && hasCommentChild) {
        return true;
    }

    const hasElementCore = /<span\s+[^>]*data-section=["']1["'][^>]*>/i.test(
        body,
    );
    const hasElementChild = /<span\s+[^>]*data-section=["']1\.[1-8]\b[^"']*["'][^>]*>/i.test(
        body,
    );
    return hasElementCore && hasElementChild;
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

const toFormat = (markdown: string): MandalaGridDocumentFormat =>
    detectDocumentFormat(markdown, false) ?? 'sections';

const parseToTree = (markdown: string, format: MandalaGridDocumentFormat) => {
    if (format === 'outline') return outlineToJson(markdown);
    if (format === 'html-element') return htmlElementToJson(markdown);
    return htmlCommentToJson(markdown);
};

const parseMandalaEmbedDocument = (
    markdown: string,
): ParsedMandalaEmbedDocument | null => {
    const { body, frontmatter } = extractFrontmatter(markdown);
    if (!isMandalaDocument(frontmatter, body)) return null;

    const format = toFormat(markdown);
    const tree = parseToTree(body, format);
    const document = jsonToColumns(tree);
    const sections = calculateMandalaTreeIndexes(document.columns);
    return {
        document,
        sections,
    };
};

const HEADING_LINE_RE = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/u;

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

const extractHeadingText = (content: string) => {
    const firstLine = content.split('\n')[0]?.trim() ?? '';
    const matched = firstLine.match(HEADING_LINE_RE);
    if (!matched?.[1]) return null;
    return normalizeHeadingText(matched[1]);
};

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

    const sectionFromPairs = resolveSectionByCommentHeadingPairs(
        markdown,
        targetHeading,
    );
    if (sectionFromPairs) return sectionFromPairs;

    const parsed = parseMandalaEmbedDocument(markdown);
    if (!parsed) return null;

    const normalizedTarget = normalizeHeadingText(targetHeading);
    const targetAnchor = toHeadingAnchor(targetHeading);

    for (const [nodeId, section] of Object.entries(parsed.sections.id_section)) {
        const content = parsed.document.content[nodeId]?.content ?? '';
        const heading = extractHeadingText(content);
        if (!heading) continue;
        if (heading === normalizedTarget) return section;
        if (toHeadingAnchor(heading) === targetAnchor) return section;
    }

    return null;
};

const resolveCenterSection = (
    requestedCenterSection: string | null | undefined,
    sectionToId: Record<string, string>,
) => {
    if (requestedCenterSection && sectionToId[requestedCenterSection]) {
        return requestedCenterSection;
    }
    if (sectionToId['1']) return '1';

    const fallbackSection = Object.keys(sectionToId)[0];
    return fallbackSection ?? '1';
};

export const createMandalaEmbedGridModel = (
    markdown: string,
    orientation: 'left-to-right' | 'south-start' | 'bottom-to-top',
    centerSection?: string | null,
): MandalaEmbedGridModel | null => {
    const parsed = parseMandalaEmbedDocument(markdown);
    if (!parsed) return null;
    const { document, sections } = parsed;
    const center = resolveCenterSection(centerSection, sections.section_id);
    const layout = getMandalaLayout(orientation);
    const sectionRows = layout.themeGrid.map((row) =>
        row.map((slot) => (slot ? `${center}.${slot}` : center)),
    );

    const rows = sectionRows.map((row) =>
        row.map((section) => {
            const nodeId = sections.section_id[section];
            const content = nodeId
                ? document.content[nodeId]?.content?.trim() ?? ''
                : '';
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
