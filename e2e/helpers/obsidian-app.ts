import { _electron as electron, ElectronApplication, Page } from '@playwright/test';

const repoRoot = process.cwd();
const vaultPath = `${repoRoot}/temp/vault`;
const pluginFiles = ['main.js', 'styles.css', 'manifest.json'] as const;

const normalizeExecutablePath = (executablePath: string) => {
    if (!executablePath.endsWith('.app')) {
        return executablePath;
    }
    const pathParts = executablePath.split('/');
    const appBundleName = pathParts[pathParts.length - 1] ?? '';
    const appName = appBundleName.replace(/\.app$/, '');
    return `${executablePath}/Contents/MacOS/${appName}`;
};

export const canLaunchObsidianElectron = (
    executablePath = process.env.OBSIDIAN_EXECUTABLE_PATH,
) => {
    if (!executablePath) {
        return false;
    }
    const normalizedPath = normalizeExecutablePath(executablePath).toLowerCase();
    return (
        normalizedPath.includes('/contents/macos/') ||
        normalizedPath.endsWith('.app') ||
        normalizedPath.endsWith('.exe')
    );
};

type TestVaultFile = {
    path: string;
};

type TestWorkspaceLeaf = {
    setViewState: (
        state: {
            type: string;
            state: { file: string };
            active: boolean;
        },
        options: { focus: boolean },
    ) => Promise<void>;
};

type TestObsidianApp = {
    vault: {
        configDir: string;
        getAbstractFileByPath: (filePath: string) => TestVaultFile | null;
        cachedRead: (file: TestVaultFile) => Promise<string>;
        modify: (file: TestVaultFile, content: string) => Promise<void>;
        create: (filePath: string, content: string) => Promise<void>;
        adapter: {
            exists: (path: string) => Promise<boolean>;
            mkdir: (path: string) => Promise<void>;
            read: (path: string) => Promise<string>;
            write: (path: string, content: string) => Promise<void>;
        };
    };
    workspace: {
        getLeaf: (newLeaf: boolean) => TestWorkspaceLeaf;
        setActiveLeaf: (
            leaf: TestWorkspaceLeaf,
            pushHistory: boolean,
            focus: boolean,
        ) => Promise<void>;
        activeLeaf?: {
            view?: TestMandalaView;
        } | null;
    };
    plugins?: {
        enabledPlugins?: {
            has: (pluginId: string) => boolean;
        };
        enablePluginAndSave?: (pluginId: string) => Promise<void>;
        disablePluginAndSave?: (pluginId: string) => Promise<void>;
        enablePlugin?: (pluginId: string) => Promise<void>;
        savePluginList?: () => Promise<void>;
    };
};

type TestMandalaView = {
    documentStore: {
        getValue: () => {
            sections: {
                section_id: Record<string, string>;
            };
        };
        dispatch: (action: unknown) => void;
    };
};

let electronApp: ElectronApplication | null = null;
let page: Page | null = null;

const prepareVaultInApp = async (obsidianPage: Page) => {
    await obsidianPage.evaluate(async ({ pluginFiles }) => {
        const app = (window as unknown as { app?: TestObsidianApp }).app;
        if (!app) {
            throw new Error('Obsidian app is not ready');
        }
        const configDir = app.vault.configDir;
        const sourcePluginDir = `${configDir}/plugins/mandala-grid-dev`;
        const targetPluginDir = `${configDir}/plugins/mandala-grid`;

        const targetExists = await app.vault.adapter.exists(targetPluginDir);
        if (!targetExists) {
            await app.vault.adapter.mkdir(targetPluginDir);
        }

        for (const file of pluginFiles) {
            const sourcePath = `${sourcePluginDir}/${file}`;
            const targetPath = `${targetPluginDir}/${file}`;
            const content = await app.vault.adapter.read(sourcePath);
            await app.vault.adapter.write(targetPath, content);
        }

        await app.vault.adapter.write(
            `${configDir}/community-plugins.json`,
            JSON.stringify(['mandala-grid'], null, 2),
        );
        await app.vault.adapter.write(
            `${configDir}/core-plugins.json`,
            JSON.stringify([], null, 2),
        );
        await app.vault.adapter.write(
            `${configDir}/app.json`,
            JSON.stringify({ legacyEditor: false }, null, 2),
        );

        const pluginManager = app.plugins;
        if (!pluginManager) {
            throw new Error('Obsidian plugin manager is not available');
        }
        if (
            pluginManager.enabledPlugins?.has('mandala-grid') &&
            pluginManager.disablePluginAndSave
        ) {
            await pluginManager.disablePluginAndSave('mandala-grid');
        }
        if (pluginManager.enablePluginAndSave) {
            await pluginManager.enablePluginAndSave('mandala-grid');
            return;
        }
        if (pluginManager.enablePlugin) {
            await pluginManager.enablePlugin('mandala-grid');
            if (pluginManager.savePluginList) {
                await pluginManager.savePluginList();
            }
            return;
        }
        throw new Error('Unable to enable mandala-grid plugin in e2e');
    }, { pluginFiles });
};

export const launchObsidian = async () => {
    if (page && electronApp) {
        return { electronApp, page };
    }
    const executablePath = process.env.OBSIDIAN_EXECUTABLE_PATH;
    if (!executablePath) {
        throw new Error('OBSIDIAN_EXECUTABLE_PATH is required for e2e tests');
    }
    if (
        process.platform !== 'linux' &&
        !canLaunchObsidianElectron(executablePath)
    ) {
        throw new Error(
            'OBSIDIAN_EXECUTABLE_PATH points to a CLI-only Obsidian build that Playwright cannot launch via electron.launch',
        );
    }

    electronApp = await electron.launch({
        executablePath: normalizeExecutablePath(executablePath),
        args: [vaultPath],
    });
    page = await electronApp.firstWindow();
    await prepareVaultInApp(page);
    await page.waitForFunction(() => {
        const app = (window as unknown as { app?: TestObsidianApp }).app;
        return Boolean(app?.plugins?.enabledPlugins?.has('mandala-grid'));
    });
    return { electronApp, page };
};

export const closeObsidian = async () => {
    if (page) {
        await page.close();
        page = null;
    }
    if (electronApp) {
        await electronApp.close();
        electronApp = null;
    }
};

export const upsertMarkdownFile = async (
    obsidianPage: Page,
    filePath: string,
    content: string,
) => {
    await obsidianPage.evaluate(
        async ({ filePath, content }) => {
            const app = (window as unknown as { app: TestObsidianApp }).app;
            const existing = app.vault.getAbstractFileByPath(filePath);
            if (existing) {
                await app.vault.modify(existing, content);
                return;
            }
            await app.vault.create(filePath, content);
        },
        { filePath, content },
    );
};

export const openMandalaFile = async (obsidianPage: Page, filePath: string) => {
    await obsidianPage.evaluate(async (filePath) => {
        const app = (window as unknown as { app: TestObsidianApp }).app;
        const file = app.vault.getAbstractFileByPath(filePath);
        if (!file) {
            throw new Error(`File not found: ${filePath}`);
        }
        const leaf = app.workspace.getLeaf(true);
        await leaf.setViewState(
            {
                type: 'mandala-grid',
                state: { file: file.path },
                active: true,
            },
            { focus: true },
        );
        await app.workspace.setActiveLeaf(leaf, true, true);
    }, filePath);
    await obsidianPage.locator('.mandala-view').waitFor();
};

export const swapMandalaSections = async (
    obsidianPage: Page,
    sourceSection: string,
    targetSection: string,
) => {
    await obsidianPage.evaluate(
        ({ sourceSection, targetSection }) => {
            const app = (window as unknown as { app: TestObsidianApp }).app;
            const view = app.workspace.activeLeaf?.view;
            if (!view?.documentStore) {
                throw new Error('Mandala view is not active');
            }
            const state = view.documentStore.getValue();
            const sourceNodeId = state.sections.section_id[sourceSection];
            const targetNodeId = state.sections.section_id[targetSection];
            if (!sourceNodeId || !targetNodeId) {
                throw new Error(
                    `Missing mandala sections: ${sourceSection}, ${targetSection}`,
                );
            }
            view.documentStore.dispatch({
                type: 'document/mandala/swap',
                payload: { sourceNodeId, targetNodeId },
            });
        },
        { sourceSection, targetSection },
    );
};

export const updateMandalaSectionContent = async (
    obsidianPage: Page,
    section: string,
    content: string,
) => {
    await obsidianPage.evaluate(
        ({ section, content }) => {
            const app = (window as unknown as { app: TestObsidianApp }).app;
            const view = app.workspace.activeLeaf?.view;
            if (!view?.documentStore) {
                throw new Error('Mandala view is not active');
            }
            const state = view.documentStore.getValue();
            const nodeId = state.sections.section_id[section];
            if (!nodeId) {
                throw new Error(`Missing mandala section: ${section}`);
            }
            view.documentStore.dispatch({
                type: 'document/update-node-content',
                payload: { nodeId, content },
            });
        },
        { section, content },
    );
};

export const readVaultMarkdownFile = async (filePath: string) => {
    if (!page) {
        throw new Error('Obsidian page is not ready');
    }
    return page.evaluate(async (filePath) => {
        const app = (window as unknown as { app: TestObsidianApp }).app;
        const file = app.vault.getAbstractFileByPath(filePath);
        if (!file) {
            throw new Error(`File not found: ${filePath}`);
        }
        return app.vault.cachedRead(file);
    }, filePath);
};
