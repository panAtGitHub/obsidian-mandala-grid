import js from '@eslint/js';
import json from '@eslint/json';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CODE_FILES = ['**/*.{js,cjs,mjs,ts,tsx,mts,cts,svelte}'];
const TS_FILES = ['**/*.{ts,tsx,mts,cts}'];
const SVELTE_FILES = ['**/*.svelte'];

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

const obsidianmdRules = { ...obsidianmd.configs.recommendedWithLocalesEn };
const obsidianmdValidateRules = {
    'obsidianmd/validate-manifest': obsidianmdRules['obsidianmd/validate-manifest'],
    'obsidianmd/validate-license': obsidianmdRules['obsidianmd/validate-license'],
};
const obsidianmdCodeRules = {
    ...obsidianmdRules,
    'obsidianmd/validate-manifest': 'off',
    'obsidianmd/validate-license': 'off',
};

export default [
    {
        ignores: ['node_modules/**', 'temp/**', 'main.js'],
    },

    {
        ...js.configs.recommended,
        files: CODE_FILES,
    },
    ...tseslint.configs.recommended.map((config) =>
        config.files ? config : { ...config, files: TS_FILES },
    ),
    ...svelte.configs['flat/recommended'].map((config) =>
        config.files ? config : { ...config, files: SVELTE_FILES },
    ),

    // Type-aware linting (needed by several obsidianmd rules)
    {
        files: TS_FILES,
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir,
            },
        },
    },

    // Svelte: parse <script lang="ts"> as TypeScript
    {
        files: SVELTE_FILES,
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: ['.svelte'],
                sourceType: 'module',
            },
        },
    },

    // Obsidian plugin checks (store preflight)
    {
        files: TS_FILES,
        plugins: {
            obsidianmd,
        },
        rules: obsidianmdCodeRules,
    },

    // JSON (manifest/version/package checks)
    {
        files: ['manifest.json', 'versions.json', 'package.json'],
        language: 'json/json',
        plugins: {
            json,
            obsidianmd,
        },
        rules: {
            ...json.configs.recommended.rules,
            ...obsidianmdValidateRules,
        },
    },

    // Project conventions
    {
        files: ['**/*.{js,cjs,mjs,ts,tsx,mts,cts,svelte}'],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            svelte,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            'no-console': 'error',
            'svelte/valid-compile': ['error', { ignoreWarnings: true }],
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },

    // Svelte-specific pragmatic overrides for existing codebase
    {
        files: SVELTE_FILES,
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'svelte/no-useless-mustaches': 'off',
            'svelte/require-each-key': 'off',
        },
    },

    // Allow trusted HTML rendering only in explicit files
    {
        files: [
            'src/view/components/container/modals/snapshots-list/components/snapshot-button.svelte',
            'src/view/components/container/toolbar-vertical/vertical-toolbar.svelte',
            'src/view/components/container/toolbar-vertical/zoom-buttons/zoom-buttons.svelte',
            'src/view/components/container/modals/hotkeys/components/hotkey/editor-state/render-editor-state.svelte',
            'src/view/components/mandala/mandala-overview-simple.svelte',
            'src/view/modals/vertical-toolbar-buttons/components/vertical-toolbar-icons-selection-modal.svelte',
            'src/view/modals/split-node-modal/components/components/content-preview.svelte',
        ],
        rules: {
            'svelte/no-at-html-tags': 'off',
        },
    },

    // Test utilities and specs
    {
        files: ['**/*.spec.ts', '**/test-helpers/**'],
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-unused-vars': 'off',
        },
    },

    // Legacy UI code still relies on direct style assignment in several paths
    {
        files: ['src/**/*.{ts,svelte}'],
        plugins: {
            obsidianmd,
        },
        rules: {
            'obsidianmd/no-static-styles-assignment': 'warn',
        },
    },
];
