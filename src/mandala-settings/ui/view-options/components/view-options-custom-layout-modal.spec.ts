import { build } from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';
import { svelteBuildOptions } from '../../../../../scripts/svelte-build-options.mjs';
import type { MandalaCustomLayout } from 'src/mandala-settings/state/settings-type';

describe('custom layout modal runtime', () => {
    let bundle: string;
    beforeAll(async () => {
        const result = await build({
            stdin: {
                contents: `
                    import Modal from './src/mandala-settings/ui/view-options/components/view-options-custom-layout-modal.svelte';
                    import { createClassComponent } from 'svelte/legacy';
                    import { flushSync } from 'svelte';
                    export function open(target, props) {
                        return createClassComponent({ component: Modal, target, props });
                    }
                    export const flush = flushSync;
                `,
                resolveDir: process.cwd(),
            },
            bundle: true,
            write: false,
            format: 'iife',
            globalName: 'runtime',
            conditions: ['browser', 'svelte'],
            alias: { obsidian: './src/shared/test-helpers/obsidian-mock.ts' },
            define: { 'process.env.NODE_ENV': '"development"' },
            plugins: [esbuildSvelte(svelteBuildOptions)],
        });
        bundle = result.outputFiles[0].text;
    }, 30000);

    it('saves a new layout, edits it and closes after applying', async () => {
        const dom = new JSDOM('<div id="target"></div>', {
            runScripts: 'outside-only',
            url: 'https://test.local',
        });
        try {
            Reflect.set(dom.window, 'activeDocument', dom.window.document);
            dom.window.eval(bundle);
            const runtime = Reflect.get(dom.window, 'runtime') as {
                open(
                    target: Element,
                    props: Record<string, unknown>,
                ): {
                    $set(props: Record<string, unknown>): void;
                    $destroy(): void;
                };
                flush(): void;
            };
            const target = dom.window.document.getElementById('target');
            if (!target) throw new Error('Missing target');
            let layouts: MandalaCustomLayout[] = [];
            const component = runtime.open(target, {
                open: true,
                onClose: () => component.$set({ open: false }),
                onSelectLayout: (activeLayoutId: string) =>
                    component.$set({ activeLayoutId }),
                onCreateCustomLayout: (layout: MandalaCustomLayout) => {
                    layouts = [layout];
                    component.$set({ customLayouts: layouts });
                },
                onUpdateCustomLayout: (
                    id: string,
                    name: string,
                    pattern: string,
                ) => {
                    layouts = [{ id, name, pattern }];
                    component.$set({ customLayouts: layouts });
                },
            });
            const document = dom.window.document;
            const click = (selector: string) => {
                const button =
                    document.querySelector<HTMLButtonElement>(selector);
                if (!button) throw new Error(`Missing ${selector}`);
                button.click();
                runtime.flush();
            };
            const input = (element: HTMLInputElement, value: string) => {
                element.value = value;
                element.dispatchEvent(
                    new dom.window.Event('input', { bubbles: true }),
                );
                runtime.flush();
            };
            click('.custom-layout-modal__create-button');
            const name = document.querySelector<HTMLInputElement>(
                '.custom-layout-modal__name-input',
            );
            if (!name) throw new Error('Missing name input');
            input(name, 'Test');
            document
                .querySelectorAll<HTMLInputElement>(
                    '.custom-layout-modal__grid-input',
                )
                .forEach((cell, index) => input(cell, String(index + 1)));
            click('.custom-layout-modal__save-button');
            expect(layouts[0]?.pattern).toBe('123405678');
            input(name, 'Updated');
            click('.custom-layout-modal__save-button');
            expect(layouts[0]?.name).toBe('Updated');
            click('.view-options-menu__close');
            await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
            expect(document.querySelector('.custom-layout-modal')).toBeNull();
            component.$set({ open: true });
            runtime.flush();
            expect(
                document.querySelectorAll('.custom-layout-modal'),
            ).toHaveLength(1);
            component.$destroy();
            await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
            expect(document.querySelector('.custom-layout-modal')).toBeNull();
        } finally {
            dom.window.close();
        }
    });
});
