import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';
import { parseSections } from 'src/engine/mandala-document';

export const mapDocumentToText = (fileData: string) => {
    const { body, frontmatter } = extractFrontmatter(fileData);
    const parsed = parseSections(body);
    if (parsed.sections.length === 0) {
        return fileData;
    }
    const text = parsed.sections.map((section) => section.content).join('\n\n');
    return (frontmatter ? frontmatter + '\n' : '') + text;
};
