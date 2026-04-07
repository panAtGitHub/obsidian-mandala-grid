import { defineConfig } from 'vitest/config';
import path from 'node:path';

const configMain = defineConfig({
    test: {
        threads: true,
        environment: 'node',
        exclude: ['temp/**', 'node_modules/**'],
        alias: {
            'src': path.resolve('./src'),
            'obsidian': path.resolve('./src/shared/test-helpers/obsidian-mock.ts'),
        },
    },
});

export default configMain;
