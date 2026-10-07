import { build } from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { svelteBuildOptions } from '../../../scripts/svelte-build-options.mjs';

type Runtime = {
    open(
        target: Element,
        props: Record<string, () => void>,
    ): {
        setDisabled(value: boolean): void;
    };
    flush(): void;
    close(component: object): Promise<void>;
};

describe('compiled Svelte runtime', () => {
    let bundle: string;

    beforeAll(async () => {
        const result = await build({
            stdin: {
                contents: `
                    import Fixture from './src/shared/test-helpers/svelte-runtime-fixture.svelte';
                    import { mount, unmount, flushSync } from 'svelte';
                    export function open(target, props) {
                        const component = mount(Fixture, { target, props });
                        flushSync();
                        return component;
                    }
                    export const flush = flushSync;
                    export const close = unmount;
                `,
                resolveDir: process.cwd(),
            },
            bundle: true,
            write: false,
            format: 'iife',
            globalName: 'runtime',
            conditions: ['browser', 'svelte'],
            define: { 'process.env.NODE_ENV': '"production"' },
            plugins: [esbuildSvelte(svelteBuildOptions)],
        });
        bundle = result.outputFiles[0].text;
    }, 30000);

    it('mounts synchronously, handles clicks, updates and cleans up on reopen', async () => {
        const dom = new JSDOM('<div id="target"></div>', {
            runScripts: 'outside-only',
        });
        try {
            dom.window.eval(bundle);
            // The generated bundle exposes this API in the isolated browser realm.
            const runtime = Reflect.get(dom.window, 'runtime') as Runtime;
            const target = dom.window.document.getElementById('target');
            if (!target) throw new Error('Missing fixture target');
            const props = {
                clicked: vi.fn(),
                mounted: vi.fn(),
                destroyed: vi.fn(),
            };
            const component = runtime.open(target, props);
            expect(props.mounted).toHaveBeenCalledTimes(1);
            expect(target.querySelector('svg')).not.toBeNull();
            const button = target.querySelector('button');
            if (!button) throw new Error('Missing fixture button');
            button.click();
            expect(props.clicked).toHaveBeenCalledTimes(1);
            component.setDisabled(true);
            runtime.flush();
            expect(button.disabled).toBe(true);
            button.click();
            expect(props.clicked).toHaveBeenCalledTimes(1);
            await runtime.close(component);
            expect(props.destroyed).toHaveBeenCalledTimes(1);
            expect(target.querySelector('button')).toBeNull();
            const reopened = runtime.open(target, props);
            target.querySelector('button')?.click();
            expect(props.clicked).toHaveBeenCalledTimes(2);
            await runtime.close(reopened);
            expect(props.destroyed).toHaveBeenCalledTimes(2);
        } finally {
            dom.window.close();
        }
    });
});
