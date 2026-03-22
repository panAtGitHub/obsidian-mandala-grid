import { TFile } from 'obsidian';
import { describe, expect, it, vi } from 'vitest';
import { cleanupSectionSessionFolder } from 'src/obsidian/helpers/inline-editor/cleanup-section-session-folder';

describe('cleanupSectionSessionFolder', () => {
    it('deletes orphaned session files and removes the empty folder', async () => {
        const tempFilePath = 'Mandala Grid Section Edit Sessions/123-1-1.md';
        const tempFile = Object.assign(new TFile(), {
            path: tempFilePath,
        });
        const list = vi
            .fn()
            .mockResolvedValueOnce({
                files: [tempFilePath],
                folders: [],
            })
            .mockResolvedValueOnce({
                files: [],
                folders: [],
            });
        const removeFile = vi.fn().mockResolvedValue(undefined);
        const rmdir = vi.fn().mockResolvedValue(undefined);
        const view = {
            app: {
                vault: {
                    adapter: {
                        list,
                        remove: vi.fn().mockResolvedValue(undefined),
                        rmdir,
                    },
                    getAbstractFileByPath: vi.fn().mockReturnValue(tempFile),
                    delete: removeFile,
                },
                workspace: {
                    getLeavesOfType: vi.fn().mockReturnValue([]),
                },
            },
        };

        await cleanupSectionSessionFolder(
            view as never,
            'Mandala Grid Section Edit Sessions',
        );

        expect(removeFile).toHaveBeenCalledWith(tempFile);
        expect(rmdir).toHaveBeenCalledWith(
            'Mandala Grid Section Edit Sessions',
            false,
        );
    });

    it('keeps tracked session files in place', async () => {
        const tempFilePath = 'Mandala Grid Section Edit Sessions/123-1-1.md';
        const list = vi
            .fn()
            .mockResolvedValueOnce({
                files: [tempFilePath],
                folders: [],
            })
            .mockResolvedValueOnce({
                files: [tempFilePath],
                folders: [],
            });
        const removeFile = vi.fn().mockResolvedValue(undefined);
        const rmdir = vi.fn().mockResolvedValue(undefined);
        const view = {
            app: {
                vault: {
                    adapter: {
                        list,
                        remove: vi.fn().mockResolvedValue(undefined),
                        rmdir,
                    },
                    getAbstractFileByPath: vi.fn().mockReturnValue(null),
                    delete: removeFile,
                },
                workspace: {
                    getLeavesOfType: vi.fn().mockReturnValue([]),
                },
            },
        };

        await cleanupSectionSessionFolder(
            view as never,
            'Mandala Grid Section Edit Sessions',
            new Set([tempFilePath]),
        );

        expect(removeFile).not.toHaveBeenCalled();
        expect(rmdir).not.toHaveBeenCalled();
    });

    it('keeps temp files that are still open in markdown leaves', async () => {
        const tempFilePath = 'Mandala Grid Section Edit Sessions/123-1-1.md';
        const list = vi
            .fn()
            .mockResolvedValueOnce({
                files: [tempFilePath],
                folders: [],
            })
            .mockResolvedValueOnce({
                files: [tempFilePath],
                folders: [],
            });
        const removeFile = vi.fn().mockResolvedValue(undefined);
        const rmdir = vi.fn().mockResolvedValue(undefined);
        const view = {
            app: {
                vault: {
                    adapter: {
                        list,
                        remove: vi.fn().mockResolvedValue(undefined),
                        rmdir,
                    },
                    getAbstractFileByPath: vi.fn().mockReturnValue(null),
                    delete: removeFile,
                },
                workspace: {
                    getLeavesOfType: vi.fn().mockReturnValue([
                        {
                            view: {
                                file: {
                                    path: tempFilePath,
                                },
                            },
                        },
                    ]),
                },
            },
        };

        await cleanupSectionSessionFolder(
            view as never,
            'Mandala Grid Section Edit Sessions',
        );

        expect(removeFile).not.toHaveBeenCalled();
        expect(rmdir).not.toHaveBeenCalled();
    });

    it('ignores missing session folders', async () => {
        const view = {
            app: {
                vault: {
                    adapter: {
                        list: vi
                            .fn()
                            .mockRejectedValue(
                                new Error('ENOENT: no such file or directory'),
                            ),
                        remove: vi.fn().mockResolvedValue(undefined),
                        rmdir: vi.fn().mockResolvedValue(undefined),
                    },
                    getAbstractFileByPath: vi.fn().mockReturnValue(null),
                    delete: vi.fn().mockResolvedValue(undefined),
                },
                workspace: {
                    getLeavesOfType: vi.fn().mockReturnValue([]),
                },
            },
        };

        await expect(
            cleanupSectionSessionFolder(
                view as never,
                'Mandala Grid Section Edit Sessions',
            ),
        ).resolves.toBeUndefined();
    });
});
