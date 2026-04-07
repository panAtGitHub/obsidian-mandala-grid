import { Notice } from 'obsidian';
import { toPng } from 'html-to-image';
import type { LastExportPreset } from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

type ExportMode = 'png-square' | 'png-screen' | 'pdf-a4';
const A4_PAGE_SIZE_MICRONS = {
    portrait: {
        width: 210000,
        height: 297000,
    },
    landscape: {
        width: 297000,
        height: 210000,
    },
} as const;

type ElectronDialog = {
    dialog?: {
        showSaveDialog: (options: {
            title: string;
            defaultPath: string;
            filters: { name: string; extensions: string[] }[];
        }) => Promise<{ canceled: boolean; filePath?: string }>;
    };
    remote?: {
        dialog?: {
            showSaveDialog: (options: {
                title: string;
                defaultPath: string;
                filters: { name: string; extensions: string[] }[];
            }) => Promise<{ canceled: boolean; filePath?: string }>;
        };
        getCurrentWindow?: () => {
            webContents?: {
                printToPDF?: (options: {
                    pageSize: string | { width: number; height: number };
                    landscape?: boolean;
                    printBackground?: boolean;
                    marginsType?: number;
                }) => Promise<Uint8Array>;
            };
        };
    };
};

type ElectronFs = {
    writeFile: (
        path: string,
        data: Uint8Array,
        cb: (err?: Error) => void,
    ) => void;
};

type CreateViewOptionsExportActionsArgs = {
    view: MandalaView;
    isMobile: boolean;
    getExportMode: () => ExportMode;
    getIncludeSidebarInPngScreen: () => boolean;
    getWhiteThemeMode: () => boolean;
    getSquareLayout: () => boolean;
    getBorderOpacity: () => number;
    getGridHighlightWidth: () => number;
    getGridHighlightColor: () => string;
    getA4Mode: () => boolean;
    getA4Orientation: () => 'portrait' | 'landscape';
    createCurrentExportPreset: () => LastExportPreset;
    persistLastExportPreset: (preset?: LastExportPreset) => void;
    closeExportMode: () => void;
};

const applyInlineStyles = (
    element: HTMLElement,
    styles: Partial<CSSStyleDeclaration>,
) => {
    Object.assign(element.style, styles);
};

const collectCssVariables = (elements: HTMLElement[]) => {
    const vars: Record<string, string> = {};
    for (const element of elements) {
        const computed = getComputedStyle(element);
        for (let i = 0; i < computed.length; i += 1) {
            const key = computed[i];
            if (!key.startsWith('--')) continue;
            const value = computed.getPropertyValue(key).trim();
            if (!value) continue;
            vars[key] = value;
        }
    }
    return vars;
};

const applyCssVariables = (
    element: HTMLElement,
    vars: Record<string, string>,
) => {
    element.setCssProps(vars);
};

const withPrintTarget = (target: HTMLElement, callback: () => Promise<void>) => {
    document.body.classList.add('mandala-print-export');
    document.body.classList.add('mandala-export-hide-controls');
    target.classList.add('mandala-print-target');
    return callback().finally(() => {
        document.body.classList.remove('mandala-print-export');
        document.body.classList.remove('mandala-export-hide-controls');
        target.classList.remove('mandala-print-target');
    });
};

const withExportControlsHidden = async (callback: () => Promise<void>) => {
    document.body.classList.add('mandala-export-hide-controls');
    try {
        await callback();
    } finally {
        document.body.classList.remove('mandala-export-hide-controls');
    }
};

const renderToPNGDataUrl = async (
    target: HTMLElement,
    options?: {
        width?: number;
        height?: number;
        pixelRatio?: number;
    },
) => {
    const backgroundColor = getComputedStyle(
        document.documentElement,
    ).getPropertyValue('--background-primary');
    const safeBackground =
        backgroundColor && backgroundColor.trim().length > 0
            ? backgroundColor.trim()
            : '#ffffff';
    return toPng(target, {
        pixelRatio: options?.pixelRatio ?? 2,
        backgroundColor: safeBackground,
        width: options?.width,
        height: options?.height,
    });
};

export const createViewOptionsExportActions = ({
    view,
    isMobile,
    getExportMode,
    getIncludeSidebarInPngScreen,
    getWhiteThemeMode,
    getSquareLayout,
    getBorderOpacity,
    getGridHighlightWidth,
    getGridHighlightColor,
    getA4Mode,
    getA4Orientation,
    createCurrentExportPreset,
    persistLastExportPreset,
    closeExportMode,
}: CreateViewOptionsExportActionsArgs) => {
    const exportToPNG = async (
        target: HTMLElement,
        options?: {
            width?: number;
            height?: number;
            pixelRatio?: number;
        },
    ) => {
        const exportPreset = createCurrentExportPreset();
        const loadingNotice = new Notice('正在导出 PNG...', 0);
        if (!target) {
            loadingNotice.hide();
            new Notice('未找到可导出的视图区域。');
            return;
        }

        let dataUrl = '';
        try {
            dataUrl = await renderToPNGDataUrl(target, options);
        } catch {
            loadingNotice.hide();
            new Notice('导出失败，请稍后再试。');
            closeExportMode();
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultName = `mandala-${timestamp}.png`;
        const electronRequire = (
            window as unknown as { require?: (module: string) => unknown }
        ).require;
        const electron = electronRequire?.('electron') as
            | ElectronDialog
            | undefined;
        const dialog = electron?.dialog ?? electron?.remote?.dialog;

        if (dialog) {
            const result = await dialog.showSaveDialog({
                title: '导出 PNG',
                defaultPath: defaultName,
                filters: [{ name: 'PNG', extensions: ['png'] }],
            });
            if (!result.canceled && result.filePath) {
                const fs = electronRequire?.('fs') as ElectronFs | undefined;
                if (!fs) {
                    loadingNotice.hide();
                    new Notice('导出失败，请稍后再试。');
                    closeExportMode();
                    return;
                }
                const base64 = dataUrl.split(',')[1] ?? '';
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i += 1) {
                    bytes[i] = binary.charCodeAt(i);
                }
                fs.writeFile(result.filePath, bytes, (err) => {
                    loadingNotice.hide();
                    if (err) {
                        new Notice('导出失败，请稍后再试。');
                    } else {
                        new Notice('PNG 导出完成。');
                        persistLastExportPreset(exportPreset);
                    }
                });
                closeExportMode();
                return;
            }
            loadingNotice.hide();
            closeExportMode();
            return;
        }

        loadingNotice.hide();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = defaultName;
        link.click();
        persistLastExportPreset(exportPreset);
        closeExportMode();
    };

    const exportCurrentView = async (mode: 'png-square' | 'png-screen') => {
        const createSquarePngExportTarget = (source: HTMLElement) => {
            const rect = source.getBoundingClientRect();
            const computed = getComputedStyle(source);
            const borderColor = computed.getPropertyValue(
                '--mandala-border-color',
            );
            const sourceWidth = Math.max(1, Math.ceil(rect.width));
            const sourceHeight = Math.max(1, Math.ceil(rect.height));
            const canvasSize = Math.max(sourceWidth, sourceHeight);
            const scale = Math.min(
                canvasSize / sourceWidth,
                canvasSize / sourceHeight,
            );
            const tx = (canvasSize - sourceWidth * scale) / 2;
            const ty = (canvasSize - sourceHeight * scale) / 2;
            const cssVars = collectCssVariables([
                document.documentElement,
                view.containerEl,
                source,
            ]);

            const wrapper = document.createElement('div');
            applyCssVariables(wrapper, cssVars);
            if (borderColor.trim().length > 0) {
                applyInlineStyles(wrapper, {
                    ['--mandala-border-color' as keyof CSSStyleDeclaration]:
                        borderColor,
                });
            }
            applyInlineStyles(wrapper, {
                position: 'fixed',
                left: '0',
                top: '0',
                width: `${canvasSize}px`,
                height: `${canvasSize}px`,
                zIndex: '-1',
                pointerEvents: 'none',
                overflow: 'hidden',
                background: getComputedStyle(
                    document.documentElement,
                ).getPropertyValue('--background-primary'),
                boxSizing: 'border-box',
            });

            const clone = source.cloneNode(true) as HTMLElement;
            if (getWhiteThemeMode()) {
                clone.classList.add('mandala-white-theme');
            }
            applyInlineStyles(clone, {
                margin: '0',
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                left: '0',
                top: '0',
                position: 'absolute',
                width: `${sourceWidth}px`,
                height: `${sourceHeight}px`,
                boxSizing: 'border-box',
                transformOrigin: 'top left',
            });

            wrapper.appendChild(clone);
            document.body.appendChild(wrapper);

            return {
                element: wrapper,
                width: canvasSize,
                height: canvasSize,
                cleanup: () => wrapper.remove(),
            };
        };

        const getExportTarget = () => {
            if (mode === 'png-square') {
                return view.contentEl.querySelector<HTMLElement>(
                    '.mandala-scroll',
                );
            }
            if (!getIncludeSidebarInPngScreen()) {
                return view.contentEl.querySelector<HTMLElement>(
                    '.mandala-scroll',
                );
            }
            return view.contentEl.querySelector<HTMLElement>(
                '.mandala-content-wrapper',
            );
        };

        const target = getExportTarget();
        if (!target) {
            new Notice('未找到可导出的视图区域。');
            return;
        }

        if (mode === 'png-square' && getSquareLayout()) {
            const exportTarget = createSquarePngExportTarget(target);
            try {
                await withExportControlsHidden(async () => {
                    await exportToPNG(exportTarget.element, {
                        pixelRatio: 2,
                        width: exportTarget.width,
                        height: exportTarget.height,
                    });
                });
            } finally {
                exportTarget.cleanup();
            }
            return;
        }

        await withExportControlsHidden(async () => {
            await exportToPNG(target, { pixelRatio: 2 });
        });
    };

    const exportCurrentViewPdf = async () => {
        const exportPreset = createCurrentExportPreset();
        if (!getA4Mode()) {
            new Notice('请先切换到纸张导出模式，再导出文件。');
            return;
        }

        const loadingNotice = new Notice('正在导出 PDF...', 0);
        const target = view.contentEl.querySelector<HTMLElement>(
            '.mandala-scroll',
        );
        if (!target) {
            loadingNotice.hide();
            new Notice('未找到可导出的视图区域。');
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
            new Notice('当前环境不支持 PDF 导出。');
            closeExportMode();
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultName = `mandala-${timestamp}.pdf`;
        const isLandscape = getA4Orientation() === 'landscape';
        const pageSize = isLandscape
            ? A4_PAGE_SIZE_MICRONS.landscape
            : A4_PAGE_SIZE_MICRONS.portrait;

        const createPrintLayer = (
            source: HTMLElement,
            orientation: 'portrait' | 'landscape',
        ) => {
            const computed = getComputedStyle(source);
            const borderColor = computed.getPropertyValue(
                '--mandala-border-color',
            );
            const sourceRoot = source.closest<HTMLElement>('.mandala-root');
            const layer = document.createElement('div');
            layer.className = 'mandala-pdf-export-layer';
            layer.classList.add('mandala-a4-mode');
            if (orientation === 'landscape') {
                layer.classList.add('mandala-a4-landscape');
            }
            if (getSquareLayout()) {
                layer.classList.add('is-desktop-square-layout');
            }
            if (sourceRoot) {
                sourceRoot.classList.forEach((className) => {
                    if (className === 'mandala-root') return;
                    layer.classList.add(className);
                });
            }
            const cssVars = collectCssVariables([
                document.documentElement,
                view.containerEl,
                sourceRoot ?? source,
                source,
            ]);
            applyCssVariables(layer, cssVars);
            applyInlineStyles(layer, {
                ['--mandala-border-opacity' as keyof CSSStyleDeclaration]: `${getBorderOpacity()}%`,
                ['--mandala-grid-highlight-width' as keyof CSSStyleDeclaration]: `${getGridHighlightWidth()}px`,
            });
            if (getGridHighlightColor().trim().length > 0) {
                applyInlineStyles(layer, {
                    ['--mandala-grid-highlight-color' as keyof CSSStyleDeclaration]:
                        getGridHighlightColor(),
                });
            }
            if (borderColor.trim().length > 0) {
                applyInlineStyles(layer, {
                    ['--mandala-border-color' as keyof CSSStyleDeclaration]:
                        borderColor,
                });
            }
            applyInlineStyles(layer, {
                display: 'block',
                width: orientation === 'landscape' ? '297mm' : '210mm',
                height: orientation === 'landscape' ? '210mm' : '297mm',
                padding: '1.27cm',
                boxSizing: 'border-box',
                background: getComputedStyle(
                    document.documentElement,
                ).getPropertyValue('--background-primary'),
            });

            const clone = source.cloneNode(true) as HTMLElement;
            if (getWhiteThemeMode()) {
                clone.classList.add('mandala-white-theme');
            }
            applyInlineStyles(clone, {
                margin: '0',
                transform: 'none',
                left: '0',
                top: '0',
                position: 'static',
                width: '100%',
                height: '100%',
                padding: '0',
                boxSizing: 'border-box',
            });

            layer.appendChild(clone);
            document.body.appendChild(layer);
            document.body.classList.add('mandala-print-export');

            return {
                layer,
                cleanup: () => {
                    document.body.classList.remove('mandala-print-export');
                    layer.remove();
                },
            };
        };

        try {
            const printLayer = createPrintLayer(
                target,
                isLandscape ? 'landscape' : 'portrait',
            );
            await withPrintTarget(printLayer.layer, async () => {
                const pdfData = await printToPDF({
                    pageSize,
                    landscape: false,
                    printBackground: true,
                    marginsType: 1,
                });
                const result = await dialog.showSaveDialog({
                    title: '导出 PDF',
                    defaultPath: defaultName,
                    filters: [{ name: 'PDF', extensions: ['pdf'] }],
                });
                if (!result.canceled && result.filePath) {
                    const fs = electronRequire?.('fs') as
                        | ElectronFs
                        | undefined;
                    if (!fs) {
                        new Notice('导出失败，请稍后再试。');
                        return;
                    }
                    const bytes =
                        pdfData instanceof Uint8Array
                            ? pdfData
                            : new Uint8Array(pdfData);
                    await new Promise<void>((resolve) => {
                        fs.writeFile(result.filePath!, bytes, (err) => {
                            if (err) {
                                new Notice('导出失败，请稍后再试。');
                            } else {
                                new Notice('PDF 导出完成。');
                                persistLastExportPreset(exportPreset);
                            }
                            resolve();
                        });
                    });
                }
            });
            printLayer.cleanup();
        } catch {
            new Notice('导出失败，请稍后再试。');
        } finally {
            loadingNotice.hide();
            closeExportMode();
        }
    };

    return {
        async exportCurrentFile() {
            if (isMobile) {
                new Notice('移动端不支持导出，请在桌面端操作');
                return;
            }
            const exportMode = getExportMode();
            if (exportMode === 'pdf-a4') {
                await exportCurrentViewPdf();
                return;
            }
            await exportCurrentView(exportMode);
        },
    };
};
