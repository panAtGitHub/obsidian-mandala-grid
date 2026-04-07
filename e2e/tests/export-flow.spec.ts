import { expect, test } from '@playwright/test';
import {
    canLaunchObsidianElectron,
    closeObsidian,
    launchObsidian,
    openMandalaFile,
    upsertMarkdownFile,
} from '../helpers/obsidian-app';

const sectionsFile = () => `---
mandala: true
---
<!--section: 1-->
导出中心卡片
<!--section: 2-->
导出验证内容
<!--section: 3-->
`;

test.skip(
    !process.env.OBSIDIAN_EXECUTABLE_PATH ||
        !canLaunchObsidianElectron(process.env.OBSIDIAN_EXECUTABLE_PATH),
    'requires a GUI-launchable Obsidian Electron executable',
);

test.afterAll(async () => {
    await closeObsidian();
});

test('runs the real PDF export flow from the view options modal', async () => {
    const { page } = await launchObsidian();
    await upsertMarkdownFile(page, 'e2e-export-flow.md', sectionsFile());
    await openMandalaFile(page, 'e2e-export-flow.md');

    await page.evaluate(() => {
        const state = {
            printToPDFCalls: 0,
            saveDialogCalls: 0,
            writeFileCalls: 0,
            hadPrintHost: false,
            hadA4Mode: false,
            hadLandscape: false,
            hadPrintClass: false,
            hadHideControlsClass: false,
            lastPrintOptions: null as null | Record<string, unknown>,
            lastSaveDialogTitle: '',
            lastWritePath: '',
            lastWriteLength: 0,
        };

        const originalRequire = (
            window as Window & {
                require?: (module: string) => unknown;
            }
        ).require;
        if (!originalRequire) {
            throw new Error('window.require is unavailable');
        }

        (
            window as Window & {
                __mandalaExportTestState?: typeof state;
                __mandalaOriginalRequire?: typeof originalRequire;
                require?: typeof originalRequire;
            }
        ).__mandalaExportTestState = state;
        (
            window as Window & {
                __mandalaOriginalRequire?: typeof originalRequire;
            }
        ).__mandalaOriginalRequire = originalRequire;

        window.require = (module: string) => {
            if (module === 'electron') {
                return {
                    dialog: {
                        showSaveDialog: async (options: {
                            title?: string;
                        }) => {
                            state.saveDialogCalls += 1;
                            state.lastSaveDialogTitle = options.title ?? '';
                            return {
                                canceled: false,
                                filePath: '/tmp/e2e-export-flow.pdf',
                            };
                        },
                    },
                    remote: {
                        dialog: {
                            showSaveDialog: async (options: {
                                title?: string;
                            }) => {
                                state.saveDialogCalls += 1;
                                state.lastSaveDialogTitle = options.title ?? '';
                                return {
                                    canceled: false,
                                    filePath: '/tmp/e2e-export-flow.pdf',
                                };
                            },
                        },
                        getCurrentWindow: () => ({
                            webContents: {
                                printToPDF: async (
                                    options: Record<string, unknown>,
                                ) => {
                                    state.printToPDFCalls += 1;
                                    state.lastPrintOptions = options;
                                    state.hadPrintHost = Boolean(
                                        document.body.querySelector(
                                            '.mandala-pdf-print-host',
                                        ),
                                    );
                                    const root = document.body.querySelector(
                                        '.mandala-pdf-print-host .mandala-root',
                                    );
                                    state.hadA4Mode = Boolean(
                                        root?.classList.contains(
                                            'mandala-a4-mode',
                                        ),
                                    );
                                    state.hadLandscape = Boolean(
                                        root?.classList.contains(
                                            'mandala-a4-landscape',
                                        ),
                                    );
                                    state.hadPrintClass =
                                        document.body.classList.contains(
                                            'mandala-print-export',
                                        );
                                    state.hadHideControlsClass =
                                        document.body.classList.contains(
                                            'mandala-export-hide-controls',
                                        );
                                    return Uint8Array.from([1, 2, 3, 4]);
                                },
                            },
                        }),
                    },
                };
            }

            if (module === 'fs') {
                return {
                    writeFile: (
                        path: string,
                        data: Uint8Array,
                        cb: (err?: Error) => void,
                    ) => {
                        state.writeFileCalls += 1;
                        state.lastWritePath = path;
                        state.lastWriteLength = data.length;
                        cb();
                    },
                };
            }

            return originalRequire(module);
        };
    });

    await page.getByRole('button', { name: '视图选项' }).click();
    await page
        .locator('.view-options-menu__item')
        .filter({ hasText: '导出模式' })
        .click();

    await expect(page.locator('.export-mode-modal')).toBeVisible();
    await page.getByRole('button', { name: 'PDF A4' }).click();
    await expect(page.locator('.mandala-root.mandala-a4-mode')).toBeVisible();

    await page.locator('.export-mode-modal select').selectOption('landscape');
    await page.getByRole('button', { name: '导出 PDF' }).click();

    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    (
                        window as Window & {
                            __mandalaExportTestState?: {
                                writeFileCalls: number;
                            };
                        }
                    ).__mandalaExportTestState?.writeFileCalls ?? 0,
            ),
        )
        .toBe(1);

    const exportState = await page.evaluate(() => {
        return (
            window as Window & {
                __mandalaExportTestState?: Record<string, unknown>;
            }
        ).__mandalaExportTestState;
    });

    expect(exportState).toMatchObject({
        printToPDFCalls: 1,
        saveDialogCalls: 1,
        writeFileCalls: 1,
        hadPrintHost: true,
        hadA4Mode: true,
        hadLandscape: true,
        hadPrintClass: true,
        hadHideControlsClass: true,
        lastSaveDialogTitle: '导出 PDF',
        lastWritePath: '/tmp/e2e-export-flow.pdf',
        lastWriteLength: 4,
        lastPrintOptions: {
            pageSize: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            margins: {
                marginType: 'none',
            },
        },
    });

    await expect(page.locator('.mandala-pdf-print-host')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveClass(/mandala-print-export/);
    await expect(page.locator('body')).not.toHaveClass(
        /mandala-export-hide-controls/,
    );
});
