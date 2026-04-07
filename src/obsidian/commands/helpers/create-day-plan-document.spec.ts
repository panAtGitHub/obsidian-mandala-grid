import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDayPlanDocument } from 'src/obsidian/commands/helpers/create-day-plan-document';
import { DEFAULT_SETTINGS } from 'src/mandala-settings/state/default-settings';
import type { Settings } from 'src/mandala-settings/state/settings-type';

const mocks = vi.hoisted(() => ({
    getActiveFile: vi.fn(),
    createNewFile: vi.fn(),
    setupDayPlanMandalaFormat: vi.fn(),
    createNewFileMandalaViewStateAction: vi.fn(),
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

vi.mock(
    'src/mandala-settings/state/current-file/mandala-view-state',
    () => ({
        createNewFileMandalaViewStateAction:
            mocks.createNewFileMandalaViewStateAction,
    }),
);

vi.mock('src/shared/store/on-plugin-error', () => ({
    onPluginError: mocks.onPluginError,
}));

describe('createDayPlanDocument', () => {
    const createSettings = (): Settings => DEFAULT_SETTINGS();

    beforeEach(() => {
        mocks.getActiveFile.mockReset();
        mocks.createNewFile.mockReset();
        mocks.setupDayPlanMandalaFormat.mockReset();
        mocks.createNewFileMandalaViewStateAction.mockReset();
        mocks.onPluginError.mockReset();
    });

    it('creates day-plan file in active file folder and initializes it', async () => {
        const folder = { path: 'projects/a' };
        const activeFile = { parent: folder };
        const createdFile = { path: 'projects/a/Day Plan.md' };
        const initialViewStateAction = {
            type: 'settings/documents/persist-mandala-view-state',
        };
        const dispatch = vi.fn();
        const settingsValue = createSettings();
        const processFrontMatter = vi.fn(
            async (
                _file: { path: string },
                callback: (frontmatter: Record<string, unknown>) => void,
            ) => {
            const frontmatter = {};
            callback(frontmatter);
            },
        );
        const plugin = {
            app: {
                fileManager: {
                    processFrontMatter,
                    trashFile: vi.fn(),
                },
                vault: {
                    getRoot: vi.fn(),
                },
            },
            settings: {
                getValue: vi.fn(() => settingsValue),
                dispatch,
            },
        };
        mocks.getActiveFile.mockReturnValue(activeFile);
        mocks.createNewFile.mockResolvedValue(createdFile);
        mocks.createNewFileMandalaViewStateAction.mockReturnValue(
            initialViewStateAction,
        );
        mocks.setupDayPlanMandalaFormat.mockResolvedValue(true);

        await createDayPlanDocument(plugin as never);

        expect(mocks.createNewFile).toHaveBeenCalledTimes(1);
        expect(mocks.createNewFile).toHaveBeenCalledWith(
            plugin,
            folder,
            expect.any(String),
            'Day Plan',
        );
        expect(
            mocks.createNewFileMandalaViewStateAction,
        ).toHaveBeenCalledWith(
            createdFile.path,
            settingsValue,
        );
        expect(dispatch).toHaveBeenCalledWith(initialViewStateAction);
        expect(mocks.setupDayPlanMandalaFormat).toHaveBeenCalledWith(
            plugin,
            createdFile,
        );
        expect(processFrontMatter).toHaveBeenCalledWith(
            createdFile,
            expect.any(Function),
        );
        expect(mocks.onPluginError).not.toHaveBeenCalled();
    });

    it('uses vault root when there is no active file', async () => {
        const root = { path: '' };
        const createdFile = { path: '/Day Plan.md' };
        const initialViewStateAction = {
            type: 'settings/documents/persist-mandala-view-state',
        };
        const dispatch = vi.fn();
        const settingsValue = createSettings();
        const processFrontMatter = vi.fn(
            async (
                _file: { path: string },
                callback: (frontmatter: Record<string, unknown>) => void,
            ) => {
            const frontmatter = {};
            callback(frontmatter);
            },
        );
        const plugin = {
            app: {
                fileManager: {
                    processFrontMatter,
                    trashFile: vi.fn(),
                },
                vault: {
                    getRoot: vi.fn(() => root),
                },
            },
            settings: {
                getValue: vi.fn(() => settingsValue),
                dispatch,
            },
        };
        mocks.getActiveFile.mockReturnValue(null);
        mocks.createNewFile.mockResolvedValue(createdFile);
        mocks.createNewFileMandalaViewStateAction.mockReturnValue(
            initialViewStateAction,
        );
        mocks.setupDayPlanMandalaFormat.mockResolvedValue(true);

        await createDayPlanDocument(plugin as never);

        expect(mocks.createNewFile).toHaveBeenCalledWith(
            plugin,
            root,
            expect.any(String),
            'Day Plan',
        );
        expect(
            mocks.createNewFileMandalaViewStateAction,
        ).toHaveBeenCalledWith(
            createdFile.path,
            settingsValue,
        );
        expect(dispatch).toHaveBeenCalledWith(initialViewStateAction);
        expect(mocks.setupDayPlanMandalaFormat).toHaveBeenCalledWith(
            plugin,
            createdFile,
        );
        expect(processFrontMatter).toHaveBeenCalledWith(
            createdFile,
            expect.any(Function),
        );
    });

    it('trashes the created file when setup is canceled', async () => {
        const folder = { path: 'projects/a' };
        const activeFile = { parent: folder };
        const createdFile = { path: 'projects/a/Day Plan.md' };
        const initialViewStateAction = {
            type: 'settings/documents/persist-mandala-view-state',
        };
        const dispatch = vi.fn();
        const settingsValue = createSettings();
        const trashFile = vi.fn();
        const processFrontMatter = vi.fn(
            async (
                _file: { path: string },
                callback: (frontmatter: Record<string, unknown>) => void,
            ) => {
            const frontmatter = {};
            callback(frontmatter);
            },
        );
        const plugin = {
            app: {
                fileManager: {
                    processFrontMatter,
                    trashFile,
                },
                vault: {
                    getRoot: vi.fn(),
                },
            },
            settings: {
                getValue: vi.fn(() => settingsValue),
                dispatch,
            },
        };
        mocks.getActiveFile.mockReturnValue(activeFile);
        mocks.createNewFile.mockResolvedValue(createdFile);
        mocks.createNewFileMandalaViewStateAction.mockReturnValue(
            initialViewStateAction,
        );
        mocks.setupDayPlanMandalaFormat.mockResolvedValue(false);

        await createDayPlanDocument(plugin as never);

        expect(processFrontMatter).toHaveBeenCalledWith(
            createdFile,
            expect.any(Function),
        );
        expect(trashFile).toHaveBeenCalledWith(createdFile);
        expect(mocks.createNewFileMandalaViewStateAction).toHaveBeenCalledWith(
            createdFile.path,
            settingsValue,
        );
        expect(dispatch).toHaveBeenCalledWith({
            type: 'settings/documents/delete-document-preferences',
            payload: {
                path: createdFile.path,
            },
        });
    });
});
