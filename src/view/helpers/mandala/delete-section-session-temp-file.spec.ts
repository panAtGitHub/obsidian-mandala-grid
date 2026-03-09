import { TFile } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';
import { deleteSectionSessionTempFile } from 'src/view/helpers/mandala/delete-section-session-temp-file';

describe('deleteSectionSessionTempFile', () => {
    it('permanently deletes the temp markdown file', async () => {
        const tempFile = new TFile();
        tempFile.path = 'Mandala Grid Section Edit Sessions/123-1-1.md';
        const deleteFile = vi.fn().mockResolvedValue(undefined);
        const view = {
            app: {
                vault: {
                    getAbstractFileByPath: vi.fn().mockReturnValue(tempFile),
                    delete: deleteFile,
                },
            },
        };

        await deleteSectionSessionTempFile(view as never, tempFile.path);

        expect(deleteFile).toHaveBeenCalledWith(tempFile);
    });

    it('ignores already deleted temp files', async () => {
        const tempFile = new TFile();
        tempFile.path = 'Mandala Grid Section Edit Sessions/123-1-1.md';
        const view = {
            app: {
                vault: {
                    getAbstractFileByPath: vi.fn().mockReturnValue(tempFile),
                    delete: vi
                        .fn()
                        .mockRejectedValue(new Error('ENOENT: no such file or directory')),
                },
            },
        };

        await expect(
            deleteSectionSessionTempFile(view as never, tempFile.path),
        ).resolves.toBeUndefined();
    });
});
