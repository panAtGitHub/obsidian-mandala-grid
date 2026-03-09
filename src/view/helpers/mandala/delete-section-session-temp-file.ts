import { TFile } from 'obsidian';

type SectionTempFileDeletionView = {
    app: {
        vault: {
            getAbstractFileByPath: (path: string) => unknown;
            delete: (file: TFile) => Promise<void>;
        };
    };
};

const isFileNotFound = (error: unknown) =>
    error instanceof Error &&
    (error.message.includes('ENOENT') || error.message.includes('NotFoundError'));

export const deleteSectionSessionTempFile = async (
    view: SectionTempFileDeletionView,
    tempFilePath: string,
) => {
    const tempFile = view.app.vault.getAbstractFileByPath(tempFilePath);
    if (!(tempFile instanceof TFile)) return;
    try {
        await view.app.vault.delete(tempFile);
    } catch (error) {
        if (isFileNotFound(error)) return;
        throw error;
    }
};
