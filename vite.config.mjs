import { defineConfig } from 'vitest/config';
import path from 'node:path';

const configMain = defineConfig({
    test: {
        threads: true,
        environment: 'node',
        exclude: ['temp/**', "node_modules/**","e2e/**"],
        alias: {
            'src': path.resolve('./src'),
            'obsidian': path.resolve('./src/helpers/test-helpers/obsidian-mock.ts')
        }
    },
});

export default configMain;
