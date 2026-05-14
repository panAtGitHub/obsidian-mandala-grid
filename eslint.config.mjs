import { defineConfig } from 'eslint/config';
import tsparser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

const SRC_TS_FILES = ['src/**/*.{ts,tsx,mts,cts}'];
const TOOLING_MJS_FILES = ['esbuild.config.mjs', 'version-bump.mjs', 'scripts/**/*.mjs'];
const REVIEW_EXCLUDED_TS_FILES = ['src/**/*.spec.ts', 'src/shared/test-helpers/**/*.ts'];
const ACTIVE_DOC_FALSE_POSITIVE_FILES = [
    'src/mandala-display/stores/document-derived-stores.ts',
    'src/mandala-document/state/document-state-type.ts',
    'src/mandala-document/state/reducers/load-document-from-file/load-document-from-file.ts',
    'src/stores/view/view-state-type.ts',
    'src/view/helpers/resolve-subpath-jump-node-id.ts',
];
const SVELTE_FILES = ['**/*.svelte'];
const ESLINT_PROJECT = './tsconfig.eslint.json';
const OBSIDIAN_RULES_OFF_FOR_TOOLING = Object.fromEntries(
    Object.keys(obsidianmd.rules).map((ruleName) => [`obsidianmd/${ruleName}`, 'off']),
);

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
                project: ESLINT_PROJECT,
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
        rules: OBSIDIAN_RULES_OFF_FOR_TOOLING,
    },
    {
        files: REVIEW_EXCLUDED_TS_FILES,
        rules: OBSIDIAN_RULES_OFF_FOR_TOOLING,
    },
    {
        files: ACTIVE_DOC_FALSE_POSITIVE_FILES,
        rules: {
            'obsidianmd/prefer-active-doc': 'off',
        },
    },
    {
        files: SVELTE_FILES,
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsparser,
                project: ESLINT_PROJECT,
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
