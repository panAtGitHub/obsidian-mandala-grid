import { Notice, TFile } from 'obsidian';
import type MandalaGrid from 'src/main';
import { onPluginError } from 'src/shared/store/on-plugin-error';

const PERF_EXPORT_SUBDIR = 'mandala-grid/perf';

const isAlreadyExistsError = (error: unknown) =>
    error instanceof Error &&
    (error.message.includes('already exists') ||
        error.message.includes('EEXIST'));

const ensureFolderRecursive = async (plugin: MandalaGrid, path: string) => {
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
        current = current ? `${current}/${part}` : part;
        if (plugin.app.vault.getAbstractFileByPath(current)) continue;
        try {
            await plugin.app.vault.createFolder(current);
        } catch (error) {
            if (!isAlreadyExistsError(error)) throw error;
        }
    }
};

const writeFile = async (
    plugin: MandalaGrid,
    path: string,
    data: string,
) => {
    const existing = plugin.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
        await plugin.app.vault.modify(existing, data);
        return;
    }
    if (existing) {
        throw new Error(`Cannot overwrite folder at ${path}`);
    }
    await plugin.app.vault.create(path, data);
};

export const exportPerfSnapshot = async (plugin: MandalaGrid) => {
    try {
        const result = await plugin.perfRecorder.exportSnapshot({
            directoryPath: `${plugin.app.vault.configDir}/${PERF_EXPORT_SUBDIR}`,
            ensureFolderRecursive: (path) => ensureFolderRecursive(plugin, path),
            writeFile: (path, data) => writeFile(plugin, path, data),
        });
        new Notice(
            `性能快照已导出到 ${result.archivePath}（${result.eventCount} 条事件）`,
            4000,
        );
    } catch (error) {
        onPluginError(error, 'command', { type: 'export-perf-snapshot' });
    }
};
