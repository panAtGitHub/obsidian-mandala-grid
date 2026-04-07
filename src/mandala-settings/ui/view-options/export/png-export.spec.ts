/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportCurrentViewPng } from 'src/mandala-settings/ui/view-options/export/png-export';
import type { LastExportPreset } from 'src/mandala-settings/state/settings-type';

const mocks = vi.hoisted(() => ({
    Notice: vi.fn(),
    toPng: vi.fn(),
}));

vi.mock('obsidian', () => ({
    Notice: mocks.Notice,
}));

vi.mock('html-to-image', () => ({
    toPng: mocks.toPng,
}));

type MockView = {
    contentEl: HTMLElement;
    containerEl: HTMLElement;
};

const createExportPreset = (): LastExportPreset => ({
    exportMode: 'png-square',
    includeSidebar: false,
    a4Orientation: 'landscape',
    backgroundMode: 'custom',
    sectionColorOpacity: 100,
    borderOpacity: 100,
    gridHighlightColor: '#418cff',
    gridHighlightWidth: 2,
    whiteThemeMode: false,
    squareLayout: true,
    fontSize3x3: 16,
    fontSize9x9: 11,
    fontSize7x9: 11,
    fontSizeSidebar: 16,
    headingsFontSizeEm: 1.8,
});

const createView = () => {
    const containerEl = document.createElement('div');
    const contentEl = document.createElement('div');
    const contentWrapper = document.createElement('div');
    const scroll = document.createElement('div');

    contentWrapper.className = 'mandala-content-wrapper';
    scroll.className = 'mandala-scroll';
    scroll.textContent = 'PNG export area';
    scroll.setCssProps({
        '--mandala-border-color': '#222222',
    });

    Object.defineProperty(scroll, 'getBoundingClientRect', {
        value: () => ({
            width: 120,
            height: 80,
            top: 0,
            left: 0,
            right: 120,
            bottom: 80,
            x: 0,
            y: 0,
            toJSON: () => null,
        }),
    });

    contentWrapper.appendChild(scroll);
    contentEl.appendChild(contentWrapper);
    containerEl.appendChild(contentEl);
    document.body.appendChild(containerEl);

    return {
        view: { contentEl, containerEl } as MockView,
        scroll,
        contentWrapper,
    };
};

describe('exportCurrentViewPng', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        document.body.className = '';
        HTMLElement.prototype.setCssProps = function (
            this: HTMLElement,
            props: Record<string, string>,
        ) {
            for (const [key, value] of Object.entries(props)) {
                this.style.setProperty(key, value);
            }
            return this;
        };
        document.documentElement.setCssProps({
            '--background-primary': '#ffffff',
        });
        mocks.Notice.mockReset();
        mocks.Notice.mockImplementation(() => ({
            hide: vi.fn(),
        }));
        mocks.toPng.mockReset();
        mocks.toPng.mockResolvedValue('data:image/png;base64,AA==');
    });

    it('renders square exports through a temporary centered wrapper and cleans it up', async () => {
        const { view, scroll } = createView();
        const exportPreset = createExportPreset();
        const persistLastExportPreset = vi.fn();
        const closeExportMode = vi.fn();
        const showSaveDialog = vi.fn().mockResolvedValue({
            canceled: false,
            filePath: '/tmp/mandala.png',
        });
        const writeFile = vi.fn(
            (
                _path: string,
                _data: Uint8Array,
                cb: (err?: Error) => void,
            ) => cb(),
        );

        (
            window as Window & {
                require?: (module: string) => unknown;
            }
        ).require = (module: string) => {
            if (module === 'electron') {
                return {
                    dialog: { showSaveDialog },
                };
            }
            if (module === 'fs') {
                return { writeFile };
            }
            return undefined;
        };

        await exportCurrentViewPng({
            view: view as never,
            mode: 'png-square',
            includeSidebarInPngScreen: false,
            whiteThemeMode: true,
            squareLayout: true,
            createCurrentExportPreset: () => exportPreset,
            persistLastExportPreset,
            closeExportMode,
        });

        const [target, options] = mocks.toPng.mock.calls[0] as [
            HTMLElement,
            { pixelRatio: number; width: number; height: number },
        ];
        const clone = target.firstElementChild as HTMLElement | null;

        expect(mocks.toPng).toHaveBeenCalledTimes(1);
        expect(target).not.toBe(scroll);
        expect(target.style.width).toBe('120px');
        expect(target.style.height).toBe('120px');
        expect(options).toEqual({
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            width: 120,
            height: 120,
        });
        expect(clone?.classList.contains('mandala-white-theme')).toBe(true);
        expect(clone?.style.transform).toBe('translate(0px, 20px) scale(1)');
        expect(document.body.querySelectorAll('.mandala-export-hide-controls')).toHaveLength(
            0,
        );
        expect(document.body.contains(target)).toBe(false);
        expect(showSaveDialog).toHaveBeenCalledTimes(1);
        expect(writeFile).toHaveBeenCalledWith(
            '/tmp/mandala.png',
            Uint8Array.from([0]),
            expect.any(Function),
        );
        expect(persistLastExportPreset).toHaveBeenCalledWith(exportPreset);
        expect(closeExportMode).toHaveBeenCalledTimes(1);
    });

    it('exports screen png from the content wrapper when sidebar inclusion is enabled', async () => {
        const { view, contentWrapper } = createView();
        const closeExportMode = vi.fn();

        await exportCurrentViewPng({
            view: view as never,
            mode: 'png-screen',
            includeSidebarInPngScreen: true,
            whiteThemeMode: false,
            squareLayout: false,
            createCurrentExportPreset: () => ({
                ...createExportPreset(),
                exportMode: 'png-screen',
                includeSidebar: true,
                squareLayout: false,
            }),
            persistLastExportPreset: vi.fn(),
            closeExportMode,
        });

        const [target, options] = mocks.toPng.mock.calls[0] as [
            HTMLElement,
            { pixelRatio: number },
        ];

        expect(target).toBe(contentWrapper);
        expect(options).toEqual({
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            width: undefined,
            height: undefined,
        });
        expect(closeExportMode).toHaveBeenCalledTimes(1);
    });
});
