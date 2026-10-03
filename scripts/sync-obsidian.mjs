import { createHash } from 'node:crypto';
import {
    copyFile,
    lstat,
    mkdir,
    readFile,
    realpath,
    stat,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceDir = resolve(
    repoRoot,
    'temp/vault/.obsidian/plugins/mandala-grid-dev',
);
const vaultDir = resolve('C:/iWork/obWin');
const targetDir = join(vaultDir, '.obsidian', 'plugins', 'mandala-grid');
const assets = ['main.js', 'styles.css', 'manifest.json'];
const hash = (contents) => createHash('sha256').update(contents).digest('hex');

const readOptional = async (path) => {
    try {
        return await readFile(path);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
    }
};

// Check every source before touching the installed plugin.
const contents = await Promise.all(
    assets.map(async (name) => {
        const path = join(sourceDir, name);
        if (!(await stat(path)).isFile())
            throw new Error(`Not a file: ${path}`);
        const content = await readFile(path);
        if (!content.length) throw new Error(`Empty build asset: ${path}`);
        return content;
    }),
);
const manifest = JSON.parse(contents[2].toString('utf8'));
if (manifest.id !== 'mandala-grid') {
    throw new Error('Built manifest must have id mandala-grid.');
}

// Require an existing vault and reject directory links redirecting the target.
if (!(await stat(join(vaultDir, '.obsidian'))).isDirectory()) {
    throw new Error(`Missing Obsidian configuration directory in ${vaultDir}`);
}
const realVaultDir = await realpath(vaultDir);
for (const relativePath of [
    '.obsidian',
    '.obsidian/plugins',
    '.obsidian/plugins/mandala-grid',
]) {
    const path = join(vaultDir, relativePath);
    await mkdir(path, { recursive: true });
    if (
        (await realpath(path)).toLowerCase() !==
        join(realVaultDir, relativePath).toLowerCase()
    ) {
        throw new Error(
            `Sync target redirects outside its expected path: ${path}`,
        );
    }
}
for (const name of assets) {
    try {
        if (!(await lstat(join(targetDir, name))).isFile()) {
            throw new Error(`Refusing to replace a link or directory: ${name}`);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}

const settingsPath = join(targetDir, 'data.json');
const settingsBefore = await readOptional(settingsPath);
for (const [index, name] of assets.entries()) {
    await copyFile(join(sourceDir, name), join(targetDir, name));
    if (hash(await readFile(join(targetDir, name))) !== hash(contents[index])) {
        throw new Error(`Synced file does not match build: ${name}`);
    }
    process.stdout.write(`Synced ${name}\n`);
}
const settingsAfter = await readOptional(settingsPath);
if (
    (settingsBefore === null) !== (settingsAfter === null) ||
    (settingsBefore !== null &&
        settingsAfter !== null &&
        !settingsBefore.equals(settingsAfter))
) {
    throw new Error(
        'data.json changed during sync; check whether Obsidian saved settings concurrently.',
    );
}
process.stdout.write(
    `Plugin ${manifest.version} synced to ${targetDir}; data.json preserved.\n`,
);
