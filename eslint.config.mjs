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
            '@typescript-eslint/no-unused-vars': ['error'],
        },
    },
];
