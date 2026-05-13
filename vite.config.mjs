import { defineConfig } from 'vitest/config';
import path from 'node:path';

const configMain = defineConfig({
    test: {
        threads: true,
        environment: 'node',
        setupFiles: ['src/shared/test-helpers/vitest-window-shim.ts'],
        exclude: ['temp/**', 'node_modules/**'],
        alias: {
            'src': path.resolve('./src'),
            'obsidian': path.resolve('./src/shared/test-helpers/obsidian-mock.ts'),
        },
    },
});

export default configMain;
