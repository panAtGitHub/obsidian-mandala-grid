/* eslint-disable import/no-nodejs-modules */
import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const vaultPath = path.join(repoRoot, 'temp', 'vault');
// E2E bootstraps an isolated test vault directly on disk before Obsidian starts.
// eslint-disable-next-line obsidianmd/hardcoded-config-path
const obsidianDir = path.join(vaultPath, '.obsidian');
const obsidianDirName = path.basename(obsidianDir);
const devPluginDir = path.join(obsidianDir, 'plugins', 'mandala-grid-dev');
const pluginDir = path.join(obsidianDir, 'plugins', 'mandala-grid');
const pluginFiles = ['main.js', 'styles.css', 'manifest.json'] as const;

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
        getAbstractFileByPath: (filePath: string) => TestVaultFile | null;
        modify: (file: TestVaultFile, content: string) => Promise<void>;
        create: (filePath: string, content: string) => Promise<void>;
    };
    workspace: {
        getLeaf: (newLeaf: boolean) => TestWorkspaceLeaf;
        setActiveLeaf: (
            leaf: TestWorkspaceLeaf,
            pushHistory: boolean,
            focus: boolean,
        ) => Promise<void>;
    };
    plugins?: {
        enabledPlugins?: {
            has: (pluginId: string) => boolean;
        };
    };
};

let electronApp: ElectronApplication | null = null;
let page: Page | null = null;

const prepareVault = async () => {
    await mkdir(pluginDir, { recursive: true });
    for (const file of pluginFiles) {
        await cp(path.join(devPluginDir, file), path.join(pluginDir, file));
    }
    await writeFile(
        path.join(obsidianDir, 'community-plugins.json'),
        JSON.stringify(['mandala-grid'], null, 2),
    );
    await writeFile(
        path.join(obsidianDir, 'core-plugins.json'),
        JSON.stringify([], null, 2),
    );
    await writeFile(
        path.join(obsidianDir, 'app.json'),
        JSON.stringify({ legacyEditor: false }, null, 2),
    );
    await writeFile(
        path.join(vaultPath, '.gitignore'),
        `${obsidianDirName}/workspace*.json\n`,
    );
};

export const launchObsidian = async () => {
    if (page && electronApp) {
        return { electronApp, page };
    }
    const executablePath = process.env.OBSIDIAN_EXECUTABLE_PATH;
    if (!executablePath) {
        throw new Error('OBSIDIAN_EXECUTABLE_PATH is required for e2e tests');
    }

    await prepareVault();
    electronApp = await electron.launch({
        executablePath,
        args: [vaultPath],
    });
    page = await electronApp.firstWindow();
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
