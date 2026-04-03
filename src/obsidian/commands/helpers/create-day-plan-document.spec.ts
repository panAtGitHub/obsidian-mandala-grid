import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDayPlanDocument } from 'src/obsidian/commands/helpers/create-day-plan-document';

const mocks = vi.hoisted(() => ({
    getActiveFile: vi.fn(),
    createNewFile: vi.fn(),
    setupDayPlanMandalaFormat: vi.fn(),
    onPluginError: vi.fn(),
}));

vi.mock('src/obsidian/commands/helpers/get-active-file', () => ({
    getActiveFile: mocks.getActiveFile,
}));

vi.mock('src/obsidian/events/workspace/effects/create-new-file', () => ({
    createNewFile: mocks.createNewFile,
}));

vi.mock('src/obsidian/commands/helpers/setup-day-plan-mandala-format', () => ({
    setupDayPlanMandalaFormat: mocks.setupDayPlanMandalaFormat,
}));

vi.mock('src/shared/store/on-plugin-error', () => ({
    onPluginError: mocks.onPluginError,
}));

describe('createDayPlanDocument', () => {
    beforeEach(() => {
        mocks.getActiveFile.mockReset();
        mocks.createNewFile.mockReset();
        mocks.setupDayPlanMandalaFormat.mockReset();
        mocks.onPluginError.mockReset();
    });

    it('creates day-plan file in active file folder and initializes it', async () => {
        const folder = { path: 'projects/a' };
        const activeFile = { parent: folder };
        const createdFile = { path: 'projects/a/Day Plan.md' };
        const plugin = {
            app: {
                vault: {
                    getRoot: vi.fn(),
                },
            },
        };
        mocks.getActiveFile.mockReturnValue(activeFile);
        mocks.createNewFile.mockResolvedValue(createdFile);

        await createDayPlanDocument(plugin as never);

        expect(mocks.createNewFile).toHaveBeenCalledTimes(1);
        expect(mocks.createNewFile).toHaveBeenCalledWith(
            plugin,
            folder,
            expect.any(String),
            'Day Plan',
        );
        expect(mocks.setupDayPlanMandalaFormat).toHaveBeenCalledWith(
            plugin,
            createdFile,
        );
        expect(mocks.onPluginError).not.toHaveBeenCalled();
    });

    it('uses vault root when there is no active file', async () => {
        const root = { path: '' };
        const createdFile = { path: '/Day Plan.md' };
        const plugin = {
            app: {
                vault: {
                    getRoot: vi.fn(() => root),
                },
            },
        };
        mocks.getActiveFile.mockReturnValue(null);
        mocks.createNewFile.mockResolvedValue(createdFile);

        await createDayPlanDocument(plugin as never);

        expect(mocks.createNewFile).toHaveBeenCalledWith(
            plugin,
            root,
            expect.any(String),
            'Day Plan',
        );
        expect(mocks.setupDayPlanMandalaFormat).toHaveBeenCalledWith(
            plugin,
            createdFile,
        );
    });
});
