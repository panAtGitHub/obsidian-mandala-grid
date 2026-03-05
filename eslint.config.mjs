import { defineConfig } from 'eslint/config';
import tsparser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

const SRC_TS_FILES = ['src/**/*.{ts,tsx,mts,cts}'];
const TOOLING_TS_FILES = ['e2e/**/*.ts', 'playwright.config.ts'];
const TOOLING_MJS_FILES = ['esbuild.config.mjs', 'version-bump.mjs', 'scripts/**/*.mjs'];
const SVELTE_FILES = ['**/*.svelte'];

export default defineConfig([
    {
        ignores: ['node_modules/**', 'temp/**', 'main.js', 'src/main.js'],
    },
    ...obsidianmd.configs.recommended,
    ...svelte.configs['flat/recommended'].map((config) =>
        config.files ? config : { ...config, files: SVELTE_FILES },
    ),
    {
        files: SRC_TS_FILES,
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: './tsconfig.json',
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                activeWindow: 'readonly',
                activeDocument: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': 'error',
        },
    },
    {
        files: TOOLING_TS_FILES,
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                activeWindow: 'readonly',
                activeDocument: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': 'error',
        },
    },
    {
        files: TOOLING_MJS_FILES,
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: SVELTE_FILES,
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsparser,
                extraFileExtensions: ['.svelte'],
                sourceType: 'module',
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                activeWindow: 'readonly',
                activeDocument: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': 'error',
        },
    },
]);
