import { MandalaSourceRuntime } from 'src/mandala-document/runtime/source-document-runtime';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';

export type SectionContentEdit = {
    sectionId: string;
    before: string;
    after: string;
};

export class SectionSaveConflict extends Error {}

export const patchSectionContents = (
    markdown: string,
    edits: SectionContentEdit[],
) => {
    const { frontmatter, body } = extractFrontmatter(markdown);
    const runtime = new MandalaSourceRuntime(body);
    if (!runtime.index.diagnostics.valid || edits.length === 0) {
        throw new Error('无法安全识别文件中的 section');
    }
    const seen = new Set<string>();
    const patches: Array<{ sectionId: string; content: string }> = [];
    for (const edit of edits) {
        if (seen.has(edit.sectionId)) throw new Error('section 重复');
        seen.add(edit.sectionId);
        const current = runtime.getContent(edit.sectionId);
        if (current === null)
            throw new SectionSaveConflict(`section ${edit.sectionId} 已不存在`);
        if (edit.before === edit.after) continue;
        if (current !== edit.before && current !== edit.after) {
            throw new SectionSaveConflict(
                `section ${edit.sectionId} 已被修改，无法安全更新`,
            );
        }
        if (current !== edit.after) {
            patches.push({ sectionId: edit.sectionId, content: edit.after });
        }
    }
    if (patches.length === 0) return markdown;
    const sectionIds = runtime.index.sourceOrderedIds.join('|');
    const result = runtime.replaceSectionContents(patches);
    if (!result || result.index.sourceOrderedIds.join('|') !== sectionIds) {
        throw new Error('无法安全更新 section');
    }
    return frontmatter + result.source;
};
