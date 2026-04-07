/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportCurrentViewPdf } from 'src/mandala-settings/ui/view-options/export/pdf-export';

const mocks = vi.hoisted(() => ({
    Notice: vi.fn(),
}));

vi.mock('obsidian', () => ({
    Notice: mocks.Notice,
}));

type MockView = {
    contentEl: HTMLElement;
    containerEl: HTMLElement;
};

const createView = () => {
    const containerEl = document.createElement('div');
    const mandalaView = document.createElement('div');
    mandalaView.className = 'mandala-view';

    const contentEl = document.createElement('div');
    const root = document.createElement('div');
    root.className =
        'mandala-root mandala-a4-mode mandala-a4-landscape mandala-white-theme';
    root.setCssProps({
        '--mandala-a4-margin': '1.27cm',
    });

    const scroll = document.createElement('div');
    scroll.className = 'mandala-scroll';
    scroll.textContent = 'A4 content';
    root.appendChild(scroll);
    contentEl.appendChild(root);
    mandalaView.appendChild(contentEl);
    containerEl.appendChild(mandalaView);
    document.body.appendChild(containerEl);

    return {
        view: { contentEl, containerEl } as MockView,
        root,
    };
};

describe('exportCurrentViewPdf', () => {
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
    });

    it('prints from a temporary normal-flow host and cleans up after success', async () => {
        const { view, root } = createView();
        const createCurrentExportPreset = vi.fn(() => ({
            exportMode: 'pdf-a4',
        }));
        const persistLastExportPreset = vi.fn();
        const closeExportMode = vi.fn();
        const showSaveDialog = vi.fn().mockResolvedValue({
            canceled: false,
            filePath: '/tmp/mandala.pdf',
        });
        const writeFile = vi.fn(
            (
                _path: string,
                _data: Uint8Array,
                cb: (err?: Error) => void,
            ) => cb(),
        );
        let capturedHost: HTMLElement | null = null;
        let capturedClone: HTMLElement | null = null;
        const printToPDF = vi.fn().mockImplementation(async (_options) => {
            capturedHost = document.body.querySelector('.mandala-pdf-print-host');
            capturedClone =
                capturedHost?.querySelector<HTMLElement>('.mandala-root') ?? null;

            expect(document.body.classList.contains('mandala-print-export')).toBe(
                true,
            );
            expect(
                document.body.classList.contains('mandala-export-hide-controls'),
            ).toBe(true);
            expect(capturedHost).not.toBeNull();
            expect(capturedClone).not.toBe(root);
            expect(capturedClone?.classList.contains('mandala-a4-landscape')).toBe(
                true,
            );
            expect(capturedClone?.style.position).toBe('static');
            expect(capturedClone?.style.width).toBe('auto');
            expect(capturedClone?.style.height).toBe('auto');

            return Uint8Array.from([1, 2, 3]);
        });

        (
            window as Window & {
                require?: (module: string) => unknown;
            }
        ).require = (module: string) => {
            if (module === 'electron') {
                return {
                    dialog: { showSaveDialog },
                    remote: {
                        getCurrentWindow: () => ({
                            webContents: {
                                printToPDF,
                            },
                        }),
                    },
                };
            }
            if (module === 'fs') {
                return { writeFile };
            }
            return undefined;
        };

        await exportCurrentViewPdf({
            view: view as never,
            a4Mode: true,
            createCurrentExportPreset,
            persistLastExportPreset,
            closeExportMode,
        });

        expect(printToPDF).toHaveBeenCalledWith({
            pageSize: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margins: {
                marginType: 'none',
            },
        });
        expect(showSaveDialog).toHaveBeenCalledTimes(1);
        expect(writeFile).toHaveBeenCalledWith(
            '/tmp/mandala.pdf',
            Uint8Array.from([1, 2, 3]),
            expect.any(Function),
        );
        expect(persistLastExportPreset).toHaveBeenCalledWith({
            exportMode: 'pdf-a4',
        });
        expect(closeExportMode).toHaveBeenCalledTimes(1);
        expect(capturedHost?.parentElement).toBeNull();
        expect(document.body.classList.contains('mandala-print-export')).toBe(
            false,
        );
        expect(
            document.body.classList.contains('mandala-export-hide-controls'),
        ).toBe(false);
        expect(createCurrentExportPreset).toHaveBeenCalledTimes(1);
    });

    it('fails fast when the current view has no exportable mandala root', async () => {
        const contentEl = document.createElement('div');
        const containerEl = document.createElement('div');
        document.body.appendChild(containerEl);

        const closeExportMode = vi.fn();

        await exportCurrentViewPdf({
            view: { contentEl, containerEl } as never,
            a4Mode: true,
            createCurrentExportPreset: vi.fn(() => ({ exportMode: 'pdf-a4' })),
            persistLastExportPreset: vi.fn(),
            closeExportMode,
        });

        expect(closeExportMode).toHaveBeenCalledTimes(1);
        expect(document.body.querySelector('.mandala-pdf-print-host')).toBeNull();
    });
});
