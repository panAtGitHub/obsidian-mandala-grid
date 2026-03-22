import { TFile } from 'obsidian';

type SectionTempFileDeletionView = {
    app: {
        vault: {
            adapter: {
                remove: (normalizedPath: string) => Promise<void>;
            };
            getAbstractFileByPath: (path: string) => unknown;
            delete: (file: TFile, force?: boolean) => Promise<void>;
        };
    };
};

const isFileNotFound = (error: unknown) =>
    error instanceof Error &&
    (error.message.includes('ENOENT') ||
        error.message.includes('NotFoundError'));

export const deleteSectionSessionTempFile = async (
    view: SectionTempFileDeletionView,
    tempFilePath: string,
) => {
    const tempFile = view.app.vault.getAbstractFileByPath(tempFilePath);
    try {
        if (!(tempFile instanceof TFile)) {
            await view.app.vault.adapter.remove(tempFilePath);
            return;
        }
        await view.app.vault.delete(tempFile);
    } catch (error) {
        if (isFileNotFound(error)) return;
        throw error;
    }
};
