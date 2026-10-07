import { createElementInDocument } from 'src/obsidian/helpers/create-element-in-document';
import { tx } from 'src/lang/translate';
import { Notice } from 'obsidian';
import type { LastExportPreset } from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

import type { ElectronDialog, ElectronFs } from './types';
import {
    applyCssVariables,
    applyInlineStyles,
    buildTimestampedFilename,
    collectCssVariables,
    withPrintTarget,
} from './shared';

type ExportCurrentViewPdfArgs = {
    view: MandalaView;
    a4Mode: boolean;
    createCurrentExportPreset: () => LastExportPreset;
    persistLastExportPreset: (preset?: LastExportPreset) => void;
    closeExportMode: () => void;
};

const createPdfPrintHost = (sourceRoot: HTMLElement, view: MandalaView) => {
    const sourceView = sourceRoot.closest<HTMLElement>('.mandala-view');
    const host = createElementInDocument('div');
    host.className = 'mandala-pdf-print-host';

    const cssVars = collectCssVariables([
        activeDocument.documentElement,
        view.containerEl,
        sourceView ?? sourceRoot,
        sourceRoot,
    ]);
    applyCssVariables(host, cssVars);
    applyInlineStyles(host, {
        display: 'block',
        boxSizing: 'border-box',
        background: getComputedStyle(
            activeDocument.documentElement,
        ).getPropertyValue('--background-primary'),
    });

    const clone = sourceRoot.cloneNode(true) as HTMLElement;
    applyInlineStyles(clone, {
        margin: '0',
        transform: 'none',
        left: 'auto',
        top: 'auto',
        position: 'static',
        width: 'auto',
        height: 'auto',
        boxSizing: 'border-box',
    });

    host.appendChild(clone);
    activeDocument.body.appendChild(host);

    return {
        host,
        cleanup: () => host.remove(),
    };
};

export const exportCurrentViewPdf = async ({
    view,
    a4Mode,
    createCurrentExportPreset,
    persistLastExportPreset,
    closeExportMode,
}: ExportCurrentViewPdfArgs) => {
    const exportPreset = createCurrentExportPreset();
    if (!a4Mode) {
        new Notice(tx('请先切换到纸张导出模式，再导出文件。'));
        return;
    }

    const loadingNotice = new Notice(tx('正在导出 PDF...'), 0);
    const sourceRoot =
        view.contentEl.querySelector<HTMLElement>('.mandala-root');
    if (!sourceRoot) {
        loadingNotice.hide();
        new Notice(tx('未找到可导出的视图区域。'));
        closeExportMode();
        return;
    }

    const electronRequire = (
        window as unknown as { require?: (module: string) => unknown }
    ).require;
    const electron = electronRequire?.('electron') as
        | ElectronDialog
        | undefined;
    const dialog = electron?.dialog ?? electron?.remote?.dialog;
    const getCurrentWindow = electron?.remote?.getCurrentWindow;
    const webContents = getCurrentWindow?.().webContents;
    const printToPDF = webContents?.printToPDF;

    if (!dialog || !printToPDF) {
        loadingNotice.hide();
        new Notice(tx('当前环境不支持 PDF 导出。'));
        closeExportMode();
        return;
    }

    const defaultName = buildTimestampedFilename('pdf');
    const printHost = createPdfPrintHost(sourceRoot, view);

    try {
        await withPrintTarget(printHost.host, async () => {
            const pdfData = await printToPDF({
                pageSize: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margins: {
                    marginType: 'none',
                },
            });
            const result = await dialog.showSaveDialog({
                title: tx('导出 PDF'),
                defaultPath: defaultName,
                filters: [{ name: 'PDF', extensions: ['pdf'] }],
            });
            if (!result.canceled && result.filePath) {
                const fs = electronRequire?.('fs') as ElectronFs | undefined;
                if (!fs) {
                    new Notice(tx('导出失败，请稍后再试。'));
                    return;
                }
                const bytes =
                    pdfData instanceof Uint8Array
                        ? pdfData
                        : new Uint8Array(pdfData);
                await new Promise<void>((resolve) => {
                    fs.writeFile(result.filePath!, bytes, (err) => {
                        if (err) {
                            new Notice(tx('导出失败，请稍后再试。'));
                        } else {
                            new Notice(tx('PDF 导出完成。'));
                            persistLastExportPreset(exportPreset);
                        }
                        resolve();
                    });
                });
            }
        });
    } catch {
        new Notice(tx('导出失败，请稍后再试。'));
    } finally {
        printHost.cleanup();
        loadingNotice.hide();
        closeExportMode();
    }
};
