import { TFile } from 'obsidian';
import { logger } from 'src/helpers/logger';
import { deleteSectionSessionTempFile } from 'src/view/helpers/mandala/delete-section-session-temp-file';

type SectionSessionFolderCleanupView = {
    app: {
        vault: {
            adapter: {
                list: (
                    path: string,
                ) => Promise<{ files: string[]; folders: string[] }>;
                remove: (normalizedPath: string) => Promise<void>;
                rmdir: (
                    normalizedPath: string,
                    recursive: boolean,
                ) => Promise<void>;
            };
            getAbstractFileByPath: (path: string) => unknown;
            delete: (file: TFile, force?: boolean) => Promise<void>;
        };
        workspace: {
            getLeavesOfType: (type: string) => unknown[];
        };
    };
};

const isFileNotFound = (error: unknown) =>
    error instanceof Error &&
    (error.message.includes('ENOENT') ||
        error.message.includes('NotFoundError'));

const getTempFilePathFromLeaf = (leaf: unknown): string | null => {
    if (!leaf || typeof leaf !== 'object' || !('view' in leaf)) {
        return null;
    }
    const viewInLeaf = (
        leaf as {
            view?: {
                file?: { path?: string };
            };
        }
    ).view;
    const path = viewInLeaf?.file?.path;
    return typeof path === 'string' ? path : null;
};

const isTempFileOpen = (
    view: SectionSessionFolderCleanupView,
    tempFilePath: string,
) =>
    view.app.workspace
        .getLeavesOfType('markdown')
        .some((leaf) => getTempFilePathFromLeaf(leaf) === tempFilePath);

const listFolder = async (
    view: SectionSessionFolderCleanupView,
    folderPath: string,
) => {
    try {
        return await view.app.vault.adapter.list(folderPath);
    } catch (error) {
        if (isFileNotFound(error)) return null;
        logger.warn(
            `Failed to list section session folder: ${folderPath}`,
            error,
        );
        return null;
    }
};

export const cleanupSectionSessionFolder = async (
    view: SectionSessionFolderCleanupView,
    folderPath: string,
    trackedTempFilePaths: ReadonlySet<string> = new Set(),
) => {
    const listed = await listFolder(view, folderPath);
    if (!listed) return;

    for (const filePath of listed.files) {
        if (
            trackedTempFilePaths.has(filePath) ||
            isTempFileOpen(view, filePath)
        ) {
            continue;
        }
        try {
            await deleteSectionSessionTempFile(view, filePath);
        } catch (error) {
            logger.warn(
                `Failed to cleanup orphaned temp session file: ${filePath}`,
                error,
            );
        }
    }

    const remaining = await listFolder(view, folderPath);
    if (!remaining) return;
    if (remaining.files.length > 0 || remaining.folders.length > 0) return;

    try {
        await view.app.vault.adapter.rmdir(folderPath, false);
    } catch (error) {
        if (isFileNotFound(error)) return;
        logger.warn(
            `Failed to remove empty session folder: ${folderPath}`,
            error,
        );
    }
};
