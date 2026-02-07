import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';

export type MandalaTemplate = {
    name: string;
    slots: string[];
};

const TEMPLATE_PREFIX = '## 模板：';
const TEMPLATE_FRONTMATTER_KEY = 'mandala-templates';

const ensureSlotsLength = (slots: string[]) => {
    const normalized = [...slots];
    while (normalized.length < 8) {
        normalized.push('');
    }
    return normalized.slice(0, 8);
};

export const parseMandalaTemplates = (markdown: string): MandalaTemplate[] => {
    const templates: MandalaTemplate[] = [];
    const lines = markdown.split('\n');
    let current: MandalaTemplate | null = null;

    for (const line of lines) {
        const headerMatch = line.match(/^##\s*模板：\s*(.+)\s*$/);
        if (headerMatch) {
            if (current) {
                current.slots = ensureSlotsLength(current.slots);
                templates.push(current);
            }
            current = {
                name: headerMatch[1].trim(),
                slots: [],
            };
            continue;
        }

        if (!current) continue;
        const slotMatch = line.match(/^\s*([1-8])\s*:\s*(.*)$/);
        if (!slotMatch) continue;
        const index = Number(slotMatch[1]) - 1;
        current.slots[index] = slotMatch[2];
    }

    if (current) {
        current.slots = ensureSlotsLength(current.slots);
        templates.push(current);
    }

    return templates;
};

export const buildMandalaTemplateBlock = (
    template: MandalaTemplate,
): string => {
    const slots = ensureSlotsLength(template.slots);
    const lines = [`${TEMPLATE_PREFIX}${template.name}`];
    for (let i = 0; i < 8; i += 1) {
        lines.push(`${i + 1}: ${slots[i] ?? ''}`);
    }
    return lines.join('\n');
};

const ensureMandalaTemplatesFrontmatter = (frontmatter: string) => {
    if (!frontmatter) {
        return `---\n${TEMPLATE_FRONTMATTER_KEY}: true\n---\n`;
    }
    const lines = frontmatter.trimEnd().split('\n');
    if (lines[0] !== '---' || lines[lines.length - 1] !== '---') {
        return `---\n${TEMPLATE_FRONTMATTER_KEY}: true\n---\n` + frontmatter;
    }
    const contentLines = lines.slice(1, -1);
    let replaced = false;
    const nextContent = contentLines.map((line) => {
        if (new RegExp(`^${TEMPLATE_FRONTMATTER_KEY}\\s*:`).test(line)) {
            replaced = true;
            return `${TEMPLATE_FRONTMATTER_KEY}: true`;
        }
        return line;
    });
    if (!replaced) {
        nextContent.unshift(`${TEMPLATE_FRONTMATTER_KEY}: true`);
    }
    return ['---', ...nextContent, '---', ''].join('\n');
};

export const appendMandalaTemplate = (
    markdown: string,
    template: MandalaTemplate,
) => {
    const { body, frontmatter } = extractFrontmatter(markdown);
    const nextFrontmatter = ensureMandalaTemplatesFrontmatter(frontmatter);
    const trimmedBody = body.trimEnd();
    const separator = trimmedBody ? '\n\n' : '';
    return (
        nextFrontmatter +
        trimmedBody +
        separator +
        buildMandalaTemplateBlock(template) +
        '\n'
    );
};

export const createEmptyTemplateFileContent = () =>
    `---\n${TEMPLATE_FRONTMATTER_KEY}: true\n---\n`;

export const formatTemplatePreview = (template: MandalaTemplate) => {
    const slots = ensureSlotsLength(template.slots);
    return slots
        .map((slot, index) => `${index + 1}: ${slot ?? ''}`)
        .join('；');
};
