import sveltePreprocess from 'svelte-preprocess';

/** @type {Parameters<typeof import('esbuild-svelte').default>[0]} */
export const svelteBuildOptions = {
    compilerOptions: { css: 'injected' },
    preprocess: sveltePreprocess({
        // Svelte 5 strips TypeScript while retaining imports used by templates.
        typescript: false,
    }),
    filterWarnings: (warning) => !/^a11y[-_]/.test(warning.code),
};
