import type { DocumentState } from 'src/mandala-document/state/document-state-type';
import { MandalaSourceRuntime } from 'src/mandala-document/runtime/source-document-runtime';
import { SectionSaveConflict } from 'src/mandala-document/runtime/patch-section-contents';

export type StructuralMutation = NonNullable<
    DocumentState['meta']['mandalaV2']['lastStructuralMutation']
>;

export const reconcileStructuralMutation = (
    runtime: MandalaSourceRuntime,
    state: Pick<DocumentState, 'document' | 'sections'>,
    mutation: StructuralMutation,
) => {
    if (!runtime.index.diagnostics.valid)
        throw new Error('无法安全识别文档结构');
    const desired = new Map(
        runtime.index.sourceOrderedIds.map((section) => [
            section,
            runtime.getContent(section) ?? '',
        ]),
    );
    const removed = new Set(mutation.removedSections);
    for (const section of mutation.removedSections) {
        if (
            runtime.index.sourceOrderedIds.some(
                (id) => id.startsWith(`${section}.`) && !removed.has(id),
            )
        ) {
            throw new SectionSaveConflict(
                `section ${section} 包含未授权删除的子 section`,
            );
        }
        const current = runtime.getContent(section);
        if (current === null) continue;
        if (current !== mutation.beforeContentBySection[section]) {
            throw new SectionSaveConflict(
                `section ${section} 已被修改，无法安全删除`,
            );
        }
        desired.delete(section);
    }
    for (const section of [
        ...mutation.changedSections,
        ...mutation.addedSections,
    ]) {
        const node = state.sections.section_id[section];
        const next = node ? state.document.content[node]?.content : undefined;
        if (next === undefined)
            throw new Error(`未找到 section ${section} 的内容`);
        const current = runtime.getContent(section);
        const before = mutation.beforeContentBySection[section];
        if (current !== null && current !== before && current !== next) {
            throw new SectionSaveConflict(
                `section ${section} 已被修改，无法安全更新`,
            );
        }
        if (current === null && before !== undefined) {
            throw new SectionSaveConflict(`section ${section} 已不存在`);
        }
        desired.set(section, next);
    }
    const section_id = Object.fromEntries(
        [...desired.keys()].map((section) => [section, section]),
    );
    const content = Object.fromEntries(
        [...desired].map(([section, value]) => [section, { content: value }]),
    );
    const result = runtime.reconcileDocumentState({
        sections: { ...state.sections, section_id },
        document: { ...state.document, content },
    });
    if (!result) {
        const unchanged =
            desired.size === runtime.index.sourceOrderedIds.length &&
            [...desired].every(
                ([section, value]) => runtime.getContent(section) === value,
            );
        if (!unchanged) throw new Error('无法安全更新文档结构');
        return runtime.source;
    }
    if (
        result.index.sourceOrderedIds.length !== desired.size ||
        result.index.sourceOrderedIds.some((section) => !desired.has(section))
    ) {
        throw new Error('结构更新影响了其他 section');
    }
    return result.source;
};
