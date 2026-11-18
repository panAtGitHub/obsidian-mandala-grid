import { Notice, TFile, type App } from 'obsidian';
import { PersistSnapshotQueue } from 'src/view/helpers/persist-snapshot-queue';
import { id } from 'src/shared/helpers/id';
import { logger } from 'src/shared/helpers/logger';
import { defaultDocumentState } from 'src/mandala-document/state/default-document-state';
import { MandalaSourceRuntime } from 'src/mandala-document/runtime/source-document-runtime';
import {
    patchSectionContents,
    type SectionContentEdit,
} from 'src/mandala-document/runtime/patch-section-contents';
import {
    reconcileStructuralMutation,
    type StructuralMutation,
} from 'src/mandala-document/runtime/reconcile-structural-mutation';
import { extractFrontmatter } from 'src/view/helpers/extract-frontmatter';

export class DocumentPersistence {
    readonly queue: PersistSnapshotQueue;
    private readonly persistSnapshotErrorKeys = new Map<string, string>();
    private readonly pendingRecoveryWrites = new Set<Promise<boolean>>();
    private readonly failedRecoveryCopies = new Map<string, string>();

    constructor(private readonly app: App) {
        this.queue = new PersistSnapshotQueue({
            delayMs: 2000,
            persistStructure: (path, data, mutation) =>
                this.persistSnapshot(path, data, mutation),
            persistSections: (path, edits) =>
                this.persistSectionEdits(path, edits),
            onError: async ({ path, data, edits, error }) => {
                const backedUp = await this.writeRecoveryCopy(
                    edits
                        ? { file: path, edits }
                        : { file: path, source: data },
                    false,
                );
                this.handlePersistSnapshotError(path, error, backedUp);
                return backedUp;
            },
        });
    }

    async flush() {
        let persistError: unknown;
        let persistFailed = false;
        try {
            await this.queue.flushAll();
        } catch (error) {
            persistFailed = true;
            persistError = error;
        }
        await Promise.all(this.pendingRecoveryWrites);
        for (const [path, data] of this.failedRecoveryCopies) {
            try {
                await this.app.vault.adapter.write(path, data);
                this.failedRecoveryCopies.delete(path);
                new Notice(`未保存的编辑已备份到 ${path}`, 0);
            } catch {
                throw new Error('无法备份未保存的编辑');
            }
        }
        if (persistFailed) throw persistError;
    }

    writeRecoveryCopy(
        snapshot: Record<string, unknown>,
        retainOnFailure = true,
    ) {
        const data = JSON.stringify(snapshot, null, 2);
        const recoveryPath = `mandala-unsaved-${id.view()}.json`;
        const write = Promise.resolve()
            .then(() => this.app.vault.adapter.write(recoveryPath, data))
            .then(() => {
                new Notice(`未保存的编辑已备份到 ${recoveryPath}`, 0);
                return true;
            })
            .catch((error: unknown) => {
                if (retainOnFailure)
                    this.failedRecoveryCopies.set(recoveryPath, data);
                logger.error('[mandala-view] recovery copy failed', error);
                new Notice('无法备份未保存的编辑，请先复制当前内容。', 0);
                return false;
            });
        this.pendingRecoveryWrites.add(write);
        void write.finally(() => this.pendingRecoveryWrites.delete(write));
        return write;
    }

    async persistSnapshot(
        path: string,
        data: string,
        structuralMutation: StructuralMutation,
    ) {
        const abstractFile = this.app.vault.getAbstractFileByPath(path);
        if (!(abstractFile instanceof TFile)) throw new Error('文件不存在');
        await this.app.vault.process(abstractFile, (current) => {
            if (structuralMutation) {
                const intended = new MandalaSourceRuntime(
                    extractFrontmatter(data).body,
                );
                if (!intended.index.diagnostics.valid)
                    throw new Error('无法安全识别待保存的文档结构');
                const state = defaultDocumentState();
                for (const section of [
                    ...structuralMutation.addedSections,
                    ...structuralMutation.changedSections,
                ]) {
                    const content = intended.getContent(section);
                    if (content === null)
                        throw new Error(`未找到待保存的 section ${section}`);
                    state.sections.section_id[section] = section;
                    state.document.content[section] = { content };
                }
                const latest = extractFrontmatter(current);
                const runtime = new MandalaSourceRuntime(latest.body);
                return (
                    latest.frontmatter +
                    reconcileStructuralMutation(
                        runtime,
                        state,
                        structuralMutation,
                    )
                );
            }
            throw new Error('缺少明确的结构修改范围');
        });
        this.persistSnapshotErrorKeys.delete(path);
    }

    async persistSectionEdits(path: string, edits: SectionContentEdit[]) {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) throw new Error('文件不存在');
        await this.app.vault.process(file, (markdown) =>
            patchSectionContents(markdown, edits),
        );
        this.persistSnapshotErrorKeys.delete(path);
    }

    private handlePersistSnapshotError(
        path: string,
        error: unknown,
        backedUp: boolean,
    ) {
        const message = error instanceof Error ? error.message : String(error);
        const errorKey = `${path}:${message}`;
        if (this.persistSnapshotErrorKeys.get(path) !== errorKey) {
            this.persistSnapshotErrorKeys.set(path, errorKey);
            new Notice(
                `保存失败：${path}。${message}。${backedUp ? '本次修改已保留在备份中。' : '请先复制当前修改。'}`,
                0,
            );
        }
        logger.error('[mandala-view] persist snapshot failed', {
            file: path,
            error: message,
        });
    }
}
