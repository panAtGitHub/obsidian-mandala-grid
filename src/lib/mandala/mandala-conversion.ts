import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { parseHtmlCommentMarker } from 'src/lib/data-conversion/helpers/html-comment-marker/parse-html-comment-marker';
import { createMandalaMarkdownTemplate } from 'src/lib/mandala/create-mandala-markdown-template';

export type MandalaConversionMode = 'template-with-content' | 'normalize-core';

export type MandalaConversionAnalysis = {
    hasMandalaFrontmatter: boolean;
    hasSections: boolean;
    hasSection1: boolean;
    hasSection1_1: boolean;
    body: string;
    frontmatter: string;
};

export const analyzeMandalaContent = (
    markdown: string,
): MandalaConversionAnalysis => {
    const { body, frontmatter } = extractFrontmatter(markdown);
    const sectionSet = new Set<string>();
    for (const line of body.split('\n')) {
        const parsed = parseHtmlCommentMarker(line);
        if (!parsed) continue;
        sectionSet.add(parsed[2]);
    }
    return {
        hasMandalaFrontmatter: /(^|\n)mandala:\s*true(\n|$)/.test(frontmatter),
        hasSections: sectionSet.size > 0,
        hasSection1: sectionSet.has('1'),
        hasSection1_1: sectionSet.has('1.1'),
        body,
        frontmatter,
    };
};

export const convertToMandalaMarkdown = (
    markdown: string,
    mode: MandalaConversionMode,
): string => {
    if (mode === 'template-with-content') {
        return convertTemplateWithContent(markdown);
    }
    return normalizeCoreMandala(markdown);
};

const convertTemplateWithContent = (markdown: string) => {
    const { body: originalBody, frontmatter } = extractFrontmatter(markdown);
    const template = createMandalaMarkdownTemplate();
    const { body: templateBody } = extractFrontmatter(template);
    const nextFrontmatter = ensureMandalaFrontmatter(frontmatter);
    const nextBody = replaceSectionContent(
        templateBody,
        '1',
        originalBody.trimEnd(),
    );
    return nextFrontmatter + nextBody;
};

const normalizeCoreMandala = (markdown: string) => {
    const { body, frontmatter } = extractFrontmatter(markdown);
    const nextFrontmatter = ensureMandalaFrontmatter(frontmatter);
    const nextBody = ensureSectionChildren(body, '1', 8);
    return nextFrontmatter + nextBody;
};

const ensureMandalaFrontmatter = (frontmatter: string) => {
    if (!frontmatter) {
        return `---\nmandala: true\n---\n`;
    }
    const lines = frontmatter.trimEnd().split('\n');
    if (lines[0] !== '---' || lines[lines.length - 1] !== '---') {
        return `---\nmandala: true\n---\n` + frontmatter;
    }
    const contentLines = lines.slice(1, -1);
    let replaced = false;
    const nextContent = contentLines.map((line) => {
        if (/^mandala\s*:/.test(line)) {
            replaced = true;
            return 'mandala: true';
        }
        return line;
    });
    if (!replaced) {
        nextContent.unshift('mandala: true');
    }
    return ['---', ...nextContent, '---', ''].join('\n');
};

const replaceSectionContent = (
    body: string,
    section: string,
    content: string,
) => {
    const lines = body.split('\n');
    const startIndex = findSectionIndex(lines, section);
    if (startIndex === -1) return body;
    const endIndex = findNextSectionIndex(lines, startIndex + 1);
    const contentLines = content ? content.split('\n') : [''];
    const deleteCount =
        endIndex === -1 ? lines.length - startIndex - 1 : endIndex - startIndex - 1;
    lines.splice(startIndex + 1, deleteCount, ...contentLines);
    return lines.join('\n');
};

const ensureSectionChildren = (
    body: string,
    section: string,
    count: number,
) => {
    const lines = body.split('\n');
    const startIndex = findSectionIndex(lines, section);
    if (startIndex === -1) return body;
    const endIndex = (() => {
        for (let i = startIndex + 1; i < lines.length; i++) {
            const parsed = parseHtmlCommentMarker(lines[i]);
            if (!parsed) continue;
            const full = parsed[2];
            if (!full.startsWith(`${section}.`)) {
                return i;
            }
        }
        return lines.length;
    })();

    const existing = new Map<number, number>();
    for (let i = startIndex + 1; i < endIndex; i++) {
        const parsed = parseHtmlCommentMarker(lines[i]);
        if (!parsed) continue;
        const full = parsed[2];
        if (!full.startsWith(`${section}.`)) continue;
        const suffix = full.slice(section.length + 1);
        if (suffix.includes('.')) continue;
        const index = Number(suffix);
        if (!Number.isNaN(index)) existing.set(index, i);
    }

    const insertions = new Map<number, string[]>();
    for (let i = 1; i <= count; i++) {
        if (existing.has(i)) continue;
        let insertAt = endIndex;
        for (let next = i + 1; next <= count; next++) {
            const nextIndex = existing.get(next);
            if (nextIndex !== undefined) {
                insertAt = nextIndex;
                break;
            }
        }
        if (!insertions.has(insertAt)) insertions.set(insertAt, []);
        insertions.get(insertAt)!.push(`<!--section: ${section}.${i}-->`, '');
    }

    const insertionPoints = Array.from(insertions.keys()).sort((a, b) => b - a);
    for (const index of insertionPoints) {
        const block = insertions.get(index);
        if (!block || block.length === 0) continue;
        lines.splice(index, 0, ...block);
    }

    return lines.join('\n');
};

const findSectionIndex = (lines: string[], section: string) => {
    for (let i = 0; i < lines.length; i++) {
        const parsed = parseHtmlCommentMarker(lines[i]);
        if (parsed?.[2] === section) return i;
    }
    return -1;
};

const findNextSectionIndex = (lines: string[], start: number) => {
    for (let i = start; i < lines.length; i++) {
        if (parseHtmlCommentMarker(lines[i])) return i;
    }
    return -1;
};
