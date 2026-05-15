import { spawnSync } from 'node:child_process';

const run = (command, args) => {
    const result = spawnSync(command, args, { stdio: 'inherit' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
};

const stagedResult = spawnSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    { encoding: 'utf8' },
);

if (stagedResult.status !== 0) {
    process.exit(stagedResult.status ?? 1);
}

const stagedFiles = stagedResult.stdout
    .split('\n')
    .map((filePath) => filePath.trim())
    .filter(Boolean)
    .filter((filePath) => /\.(js|jsx|ts|tsx|svelte)$/.test(filePath));

if (stagedFiles.length === 0) {
    console.log('No staged JS/TS/Svelte files to format or lint.');
    process.exit(0);
}

run('npx', ['prettier', '--write', ...stagedFiles]);
run('npx', ['eslint', ...stagedFiles]);
run('git', ['add', '--', ...stagedFiles]);