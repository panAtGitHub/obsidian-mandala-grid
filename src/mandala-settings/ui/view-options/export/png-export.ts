import { Notice } from 'obsidian';
import type { LastExportPreset } from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

import type { ElectronDialog, ElectronFs } from './types';
import {
    applyCssVariables,
    applyInlineStyles,
    buildTimestampedFilename,
    collectCssVariables,
    renderToPNGDataUrl,
    withExportControlsHidden,
} from './shared';

type ExportCurrentViewPngArgs = {
    view: MandalaView;
    mode: 'png-square' | 'png-screen';
    includeSidebarInPngScreen: boolean;
    whiteThemeMode: boolean;
    squareLayout: boolean;
    createCurrentExportPreset: () => LastExportPreset;
    persistLastExportPreset: (preset?: LastExportPreset) => void;
    closeExportMode: () => void;
};

export const exportCurrentViewPng = async ({
    view,
    mode,
    includeSidebarInPngScreen,
    whiteThemeMode,
    squareLayout,
    createCurrentExportPreset,
    persistLastExportPreset,
    closeExportMode,
}: ExportCurrentViewPngArgs) => {
    const exportPreset = createCurrentExportPreset();

    const exportToPNG = async (
        target: HTMLElement,
        options?: {
            width?: number;
            height?: number;
            pixelRatio?: number;
        },
    ) => {
        const loadingNotice = new Notice('正在导出 PNG...', 0);
        let dataUrl = '';
        try {
            dataUrl = await renderToPNGDataUrl(target, options);
        } catch {
            loadingNotice.hide();
            new Notice('导出失败，请稍后再试。');
            closeExportMode();
            return;
        }

        const defaultName = buildTimestampedFilename('png');
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

    const createSquarePngExportTarget = (source: HTMLElement) => {
        const rect = source.getBoundingClientRect();
        const computed = getComputedStyle(source);
        const borderColor = computed.getPropertyValue('--mandala-border-color');
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
        if (whiteThemeMode) {
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
            return view.contentEl.querySelector<HTMLElement>('.mandala-scroll');
        }
        if (!includeSidebarInPngScreen) {
            return view.contentEl.querySelector<HTMLElement>('.mandala-scroll');
        }
        return view.contentEl.querySelector<HTMLElement>('.mandala-content-wrapper');
    };

    const target = getExportTarget();
    if (!target) {
        new Notice('未找到可导出的视图区域。');
        return;
    }

    if (mode === 'png-square' && squareLayout) {
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
