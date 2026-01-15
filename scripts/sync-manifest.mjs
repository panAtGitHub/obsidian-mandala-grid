import { copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve('.');
const source = resolve(repoRoot, 'manifest.json');
const targetDir = resolve(
    repoRoot,
    'temp/vault/.obsidian/plugins/mandala-grid-dev'
);
const target = resolve(targetDir, 'manifest.json');

await copyFile(source, target);
