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
    title: string;
    body: string;
    empty: boolean;
};

export type MandalaEmbedGridModel = {
    rows: MandalaEmbedCellModel[][];
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
    const { body, frontmatter } = extractFrontmatter(markdown);
    if (!isMandalaDocument(frontmatter, body)) return null;

    const format = toFormat(markdown);
    const tree = parseToTree(body, format);
    const document = jsonToColumns(tree);
    const sections = calculateMandalaTreeIndexes(document.columns);
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
                title: preview.title,
                body: preview.body,
                empty,
            };
        }),
    );

    return { rows };
};

