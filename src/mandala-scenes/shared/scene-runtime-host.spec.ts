import { build } from 'esbuild';
import esbuildSvelte from 'esbuild-svelte';
import { JSDOM } from 'jsdom';
import { compile } from 'svelte/compiler';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { svelteBuildOptions } from '../../../scripts/svelte-build-options.mjs';

type Runtime = {
    open(target: Element, props: { committed: () => void }): object;
    flush(): void;
    close(component: object): Promise<void>;
};

describe('compiled scene runtime host', () => {
    let bundle: string;

    beforeAll(async () => {
        const result = await build({
            stdin: {
                contents: `
                    import Fixture from './src/shared/test-helpers/scene-runtime-host-fixture.svelte';
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
            plugins: [
                {
                    name: 'scene-renderer-fixtures',
                    setup(builder) {
                        // Keep the actual host and parent binding lifecycle;
                        // renderers need no Obsidian services for this check.
                        builder.onLoad(
                            {
                                filter: /mandala-scenes[\\/](shared[\\/]card-scene-host|view-9x9[\\/]layout)\.svelte$/,
                            },
                            ({ path }) => ({
                                contents: compile('<div>Scene</div>', {
                                    filename: path,
                                }).js.code,
                                loader: 'js',
                            }),
                        );
                    },
                },
                esbuildSvelte(svelteBuildOptions),
            ],
        });
        bundle = result.outputFiles[0].text;
    }, 30000);

    it('settles parent feedback and remains clickable after refresh, scene switch and reopen', async () => {
        const dom = new JSDOM('<div id="target"></div>', {
            runScripts: 'outside-only',
            pretendToBeVisual: true,
        });
        try {
            dom.window.eval(bundle);
            const runtime = Reflect.get(dom.window, 'runtime') as Runtime;
            const target = dom.window.document.getElementById('target');
            if (!target) throw new Error('Missing fixture target');
            const committed = vi.fn();
            const component = runtime.open(target, { committed });
            const refresh = target.querySelectorAll('button')[0];
            const switchScene = target.querySelectorAll('button')[1];
            const output = () => target.querySelector('output')?.textContent;
            expect(output()).toBe('0:default');
            for (let count = 1; count <= 5; count++) {
                refresh.click();
                runtime.flush();
                expect(output()).toBe(`${count}:default`);
            }
            expect(committed).not.toHaveBeenCalled();
            switchScene.click();
            runtime.flush();
            await vi.waitFor(() => {
                expect(output()).toBe('5:week-7x9');
            });
            runtime.flush();
            expect(committed).toHaveBeenCalledTimes(1);
            refresh.click();
            runtime.flush();
            expect(output()).toBe('6:week-7x9');
            switchScene.click();
            runtime.flush();
            await vi.waitFor(() => {
                expect(output()).toBe('6:default');
            });
            expect(committed).toHaveBeenCalledTimes(2);
            await runtime.close(component);
            const reopened = runtime.open(target, { committed });
            target.querySelector('button')?.click();
            runtime.flush();
            expect(output()).toBe('1:default');
            await runtime.close(reopened);
        } finally {
            dom.window.close();
        }
    });
});
