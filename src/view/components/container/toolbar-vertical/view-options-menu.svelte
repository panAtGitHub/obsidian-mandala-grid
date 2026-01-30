<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import {
        ChevronDown,
        ChevronRight,
        Frame,
        Grid3x3,
        Printer,
        RotateCcw,
        Settings,
        Trash2,
        Type,
        X,
    } from 'lucide-svelte';
    import { Notice, Platform, TFile } from 'obsidian';
    import { createEventDispatcher } from 'svelte';
    import { toPng } from 'html-to-image';
    import { createClearEmptyMandalaSubgridsPlan } from 'src/lib/mandala/clear-empty-subgrids';
    import { derived } from 'src/lib/store/derived';
    import {
        MandalaA4ModeStore,
        MandalaA4OrientationStore,
        MandalaBackgroundModeStore,
        MandalaBorderOpacityStore,
        MandalaFontSize3x3DesktopStore,
        MandalaFontSize9x9DesktopStore,
        MandalaFontSizeSidebarDesktopStore,
        MandalaModeStore,
        MandalaGridOrientationStore,
        MandalaSectionColorOpacityStore,
        SquareLayoutStore,
        WhiteThemeModeStore,
    } from 'src/stores/settings/derived/view-settings-store';
    import { getDefaultTheme } from 'src/stores/view/subscriptions/effects/css-variables/helpers/get-default-theme';
    import { openFile } from 'src/obsidian/events/workspace/effects/open-file';
    import {
        DEFAULT_CARDS_GAP,
        DEFAULT_INACTIVE_NODE_OPACITY,
        DEFAULT_H1_FONT_SIZE_EM,
    } from 'src/stores/settings/default-settings';
    import {
        appendMandalaTemplate,
        MandalaTemplate,
        parseMandalaTemplates,
    } from 'src/lib/mandala/mandala-templates';
    import {
        openMandalaTemplateNameModal,
        openMandalaTemplateSelectModal,
        openMandalaTemplatesFileModal,
    } from 'src/obsidian/modals/mandala-templates-modal';

    const dispatch = createEventDispatcher();
    const view = getView();

    export let show = false;
    let showEditOptions = false;
    let showFontOptions = false;
    let showPrintOptions = false;
    let showTemplateOptions = false;

    const a4Mode = MandalaA4ModeStore(view);
    const a4Orientation = MandalaA4OrientationStore(view);
    const borderOpacity = MandalaBorderOpacityStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const mode = MandalaModeStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);
    const squareLayout = SquareLayoutStore(view);
    const gridOrientation = MandalaGridOrientationStore(view);
    const themeDefaults = getDefaultTheme();
    const cardsGap = derived(view.plugin.settings, (state) => state.view.cardsGap);
    const fontSize3x3 = MandalaFontSize3x3DesktopStore(view);
    const fontSize9x9 = MandalaFontSize9x9DesktopStore(view);
    const fontSizeSidebar = MandalaFontSizeSidebarDesktopStore(view);
    const headingsFontSizeEm = derived(
        view.plugin.settings,
        (state) => state.view.h1FontSize_em,
    );
    const containerBg = derived(
        view.plugin.settings,
        (state) => state.view.theme.containerBg ?? themeDefaults.containerBg,
    );
    const activeBranchBg = derived(
        view.plugin.settings,
        (state) => state.view.theme.activeBranchBg ?? themeDefaults.activeBranchBg,
    );
    const activeBranchColor = derived(
        view.plugin.settings,
        (state) =>
            state.view.theme.activeBranchColor ?? themeDefaults.activeBranchColor,
    );
    const inactiveNodeOpacity = derived(
        view.plugin.settings,
        (state) => state.view.theme.inactiveNodeOpacity,
    );
    const templatesFilePathStore = derived(
        view.plugin.settings,
        (state) => state.general.mandalaTemplatesFilePath,
    );

    const toggleWhiteTheme = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-white-theme',
        });
    };

    const toggleA4Mode = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/toggle-a4-mode',
        });
    };

    const updateA4Mode = (enabled: boolean) => {
        if (enabled !== $a4Mode) {
            toggleA4Mode();
        }
    };

    const updateExportViewSize = (mode: 'a4' | 'screen' | 'square') => {
        if (mode === 'a4') {
            exportSquareSize = false;
            updateA4Mode(true);
            return;
        }

        updateA4Mode(false);
        exportSquareSize = mode === 'square';
    };

    let showImmersiveOptions = false;
    let showPanoramaOptions = false;

    const toggleImmersiveOptions = () => {
        if ($whiteThemeMode) return;
        showImmersiveOptions = !showImmersiveOptions;
    };

    const togglePanoramaOptions = () => {
        if (!$whiteThemeMode) return;
        showPanoramaOptions = !showPanoramaOptions;
    };

    const updateWhiteThemeMode = (enabled: boolean) => {
        if (enabled !== $whiteThemeMode) {
            toggleWhiteTheme();
        }
        if (enabled) {
            showImmersiveOptions = false;
        } else {
            showPanoramaOptions = false;
        }
    };

    const updateA4Orientation = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) return;
        const orientation =
            target.value === 'landscape' ? 'landscape' : 'portrait';
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-a4-orientation',
            payload: { orientation },
        });
    };

    const clampGap = (value: number) => Math.min(20, Math.max(0, value));
    const clampOpacity = (value: number) => Math.min(100, Math.max(0, value));
    const clampFontSize = (value: number) => Math.min(36, Math.max(6, value));
    const clampH1FontSize = (value: number) => Math.min(4, Math.max(1, value));

    const updateCardsGapValue = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/layout/set-cards-gap',
            payload: { gap: clampGap(value) },
        });
    };

    const updateFontSize3x3Value = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/font-size/set-3x3-desktop',
            payload: { fontSize: clampFontSize(value) },
        });
    };

    const updateFontSize9x9Value = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/font-size/set-9x9-desktop',
            payload: { fontSize: clampFontSize(value) },
        });
    };

    const updateFontSizeSidebarValue = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/font-size/set-sidebar-desktop',
            payload: { fontSize: clampFontSize(value) },
        });
    };

    const updateHeadingsFontSizeValue = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/theme/set-h1-font-size',
            payload: { fontSize_em: clampH1FontSize(value) },
        });
    };

    const updateBorderOpacityValue = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-border-opacity',
            payload: { opacity: clampOpacity(value) },
        });
    };

    const updateSectionColorOpacityValue = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-section-color-opacity',
            payload: { opacity: clampOpacity(value) },
        });
    };

    const updateInactiveNodeOpacityValue = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/theme/set-inactive-node-opacity',
            payload: { opacity: clampOpacity(value) },
        });
    };

    const updateBorderOpacity = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateBorderOpacityValue(Number(target.value));
    };

    const updateSectionColorOpacity = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateSectionColorOpacityValue(Number(target.value));
    };

    const updateInactiveNodeOpacity = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateInactiveNodeOpacityValue(Number(target.value));
    };

    const updateCardsGap = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateCardsGapValue(Number(target.value));
    };

    const updateFontSize3x3 = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateFontSize3x3Value(Number(target.value));
    };

    const updateFontSize9x9 = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateFontSize9x9Value(Number(target.value));
    };

    const updateFontSizeSidebar = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateFontSizeSidebarValue(Number(target.value));
    };

    const updateHeadingsFontSize = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateHeadingsFontSizeValue(Number.parseFloat(target.value));
    };

    const stepOpacity = (current: number, delta: number) => {
        updateSectionColorOpacityValue(current + delta);
    };

    const stepBorderOpacity = (current: number, delta: number) => {
        updateBorderOpacityValue(current + delta);
    };

    const stepInactiveOpacity = (current: number, delta: number) => {
        updateInactiveNodeOpacityValue(current + delta);
    };

    const stepCardsGap = (current: number, delta: number) => {
        updateCardsGapValue(current + delta);
    };

    const stepFontSize3x3 = (current: number, delta: number) => {
        updateFontSize3x3Value(current + delta);
    };

    const stepFontSize9x9 = (current: number, delta: number) => {
        updateFontSize9x9Value(current + delta);
    };

    const stepFontSizeSidebar = (current: number, delta: number) => {
        updateFontSizeSidebarValue(current + delta);
    };

    const stepHeadingsFontSize = (current: number, delta: number) => {
        const next = Math.round((current + delta) * 10) / 10;
        updateHeadingsFontSizeValue(next);
    };

    const updateContainerBg = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        view.plugin.settings.dispatch({
            type: 'settings/view/theme/set-container-bg-color',
            payload: { backgroundColor: target.value },
        });
    };

    const resetContainerBg = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/theme/set-container-bg-color',
            payload: { backgroundColor: undefined },
        });
    };

    const updateActiveBranchBg = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        view.plugin.settings.dispatch({
            type: 'settings/view/theme/set-active-branch-bg-color',
            payload: { backgroundColor: target.value },
        });
    };

    const resetActiveBranchBg = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/theme/set-active-branch-bg-color',
            payload: { backgroundColor: undefined },
        });
    };

    const updateActiveBranchColor = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        view.plugin.settings.dispatch({
            type: 'settings/view/theme/set-active-branch-color',
            payload: { color: target.value },
        });
    };

    const resetActiveBranchColor = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/theme/set-active-branch-color',
            payload: { color: undefined },
        });
    };

    const resetInactiveNodeOpacity = () => {
        updateInactiveNodeOpacityValue(DEFAULT_INACTIVE_NODE_OPACITY);
    };

    const resetCardsGap = () => {
        updateCardsGapValue(DEFAULT_CARDS_GAP);
    };

    const resetFontSize3x3 = () => {
        updateFontSize3x3Value(16);
    };

    const resetFontSize9x9 = () => {
        updateFontSize9x9Value(11);
    };

    const resetFontSizeSidebar = () => {
        updateFontSizeSidebarValue(16);
    };

    const resetHeadingsFontSize = () => {
        updateHeadingsFontSizeValue(DEFAULT_H1_FONT_SIZE_EM);
    };

    const updateBackgroundMode = (mode: 'none' | 'custom' | 'gray') => {
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-background-mode',
            payload: { mode },
        });
    };

    const updateSquareLayout = (enabled: boolean) => {
        if (enabled !== $squareLayout) {
            view.plugin.settings.dispatch({
                type: 'settings/view/toggle-square-layout',
            });
        }
    };

    const enableSquareExport = () => {
        updateSquareLayout(true);
        updateExportViewSize('square');
    };

    type PrintConfig = {
        a4Mode: boolean;
        a4Orientation: 'portrait' | 'landscape';
        backgroundMode: 'none' | 'custom' | 'gray';
        sectionColorOpacity: number;
        borderOpacity: number;
        whiteThemeMode: boolean;
        exportSquareSize: boolean;
    };

    let lastPrintConfig: PrintConfig | null = null;

    const capturePrintConfig = () => {
        lastPrintConfig = {
            a4Mode: $a4Mode,
            a4Orientation: $a4Orientation,
            backgroundMode: $backgroundMode,
            sectionColorOpacity: $sectionColorOpacity,
            borderOpacity: $borderOpacity,
            whiteThemeMode: $whiteThemeMode,
            exportSquareSize,
        };
    };

    const applyPrintConfig = (config: PrintConfig) => {
        updateExportViewSize(
            config.a4Mode ? 'a4' : config.exportSquareSize ? 'square' : 'screen',
        );
        updateWhiteThemeMode(config.whiteThemeMode);
        updateBackgroundMode(config.backgroundMode);
        updateSectionColorOpacityValue(config.sectionColorOpacity);
        updateBorderOpacityValue(config.borderOpacity);
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-a4-orientation',
            payload: { orientation: config.a4Orientation },
        });
    };

    const switchLastPrintConfig = () => {
        if (!lastPrintConfig) {
            new Notice('暂无可切换的打印配置。');
            return;
        }
        const current = {
            a4Mode: $a4Mode,
            a4Orientation: $a4Orientation,
            backgroundMode: $backgroundMode,
            sectionColorOpacity: $sectionColorOpacity,
            borderOpacity: $borderOpacity,
            whiteThemeMode: $whiteThemeMode,
            exportSquareSize,
        };
        applyPrintConfig(lastPrintConfig);
        lastPrintConfig = current;
    };

    const restoreEditMode = () => {
        capturePrintConfig();
        updateExportViewSize('screen');
        updateWhiteThemeMode(false);
    };

    const updateGridOrientation = (
        orientation: 'south-start' | 'left-to-right' | 'bottom-to-top',
    ) => {
        if (orientation === $gridOrientation) return;
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-grid-orientation',
            payload: { orientation },
        });
    };

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
                        pageSize:
                            | string
                            | { width: number; height: number };
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

    const createA4ExportTarget = (target: HTMLElement) => {
        const computed = getComputedStyle(target);
        const rect = target.getBoundingClientRect();
        const width = Math.ceil(rect.width);
        const height = Math.ceil(rect.height);
        const borderColor = computed.getPropertyValue('--mandala-border-color');

        const wrapper = document.createElement('div');
        wrapper.classList.add('mandala-a4-mode');
        if ($a4Orientation === 'landscape') {
            wrapper.classList.add('mandala-a4-landscape');
        }
        wrapper.style.setProperty('--mandala-border-opacity', `${$borderOpacity}%`);
        if (borderColor.trim().length > 0) {
            wrapper.style.setProperty('--mandala-border-color', borderColor);
        }
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.width = `${width}px`;
        wrapper.style.height = `${height}px`;
        wrapper.style.zIndex = '-1';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.overflow = 'hidden';
        wrapper.style.background = getComputedStyle(
            document.documentElement,
        ).getPropertyValue('--background-primary');
        wrapper.style.padding = computed.padding;
        wrapper.style.boxSizing = 'border-box';

        const clone = target.cloneNode(true) as HTMLElement;
        if ($whiteThemeMode) {
            clone.classList.add('mandala-white-theme');
        }
        clone.style.margin = '0';
        clone.style.transform = 'none';
        clone.style.left = '0';
        clone.style.top = '0';
        clone.style.position = 'static';
        clone.style.width = '100%';
        clone.style.height = '100%';
        clone.style.padding = '0';
        clone.style.boxSizing = 'border-box';

        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        return {
            element: wrapper,
            width,
            height,
            cleanup: () => wrapper.remove(),
        };
    };

    const withPrintTarget = (
        target: HTMLElement,
        callback: () => Promise<void>,
    ) => {
        document.body.classList.add('mandala-print-export');
        target.classList.add('mandala-print-target');
        return callback().finally(() => {
            document.body.classList.remove('mandala-print-export');
            target.classList.remove('mandala-print-target');
        });
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

    const exportToPNG = async (
        target: HTMLElement,
        options?: {
            width?: number;
            height?: number;
            pixelRatio?: number;
            dpi?: number;
        },
    ) => {
        const loadingNotice = new Notice('正在导出 PNG...', 0);
        if (!target) {
            loadingNotice.hide();
            new Notice('未找到可导出的视图区域。');
            return;
        }

        let dataUrl = '';
        try {
            dataUrl = await renderToPNGDataUrl(target, options);
        } catch (error) {
            loadingNotice.hide();
            new Notice('导出失败，请稍后再试。');
            closeMenu();
            return;
        }

        // DPI metadata injection is disabled until PNG chunk placement is fixed.

        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-');
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
                    closeMenu();
                    return;
                }
                const base64 = dataUrl.split(',')[1] ?? '';
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i += 1) {
                    bytes[i] = binary.charCodeAt(i);
                }
                fs?.writeFile(result.filePath, bytes, (err) => {
                    loadingNotice.hide();
                    if (err) {
                        new Notice('导出失败，请稍后再试。');
                    } else {
                        new Notice('PNG 导出完成。');
                    }
                });
                closeMenu();
                return;
            }
            loadingNotice.hide();
            closeMenu();
            return;
        }

        loadingNotice.hide();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = defaultName;
        link.click();
        closeMenu();
    };

    const exportCurrentView = async () => {
        const squarePadding = 12;
        const createSquarePngExportTarget = (source: HTMLElement) => {
            const rect = source.getBoundingClientRect();
            const computed = getComputedStyle(source);
            const borderColor = computed.getPropertyValue(
                '--mandala-border-color',
            );
            const width = Math.ceil(rect.width);
            const height = Math.ceil(rect.height);
            const size = Math.min(width, height);

            const wrapper = document.createElement('div');
            if (borderColor.trim().length > 0) {
                wrapper.style.setProperty('--mandala-border-color', borderColor);
            }
            wrapper.style.position = 'fixed';
            wrapper.style.left = '0';
            wrapper.style.top = '0';
            wrapper.style.width = `${size}px`;
            wrapper.style.height = `${size}px`;
            wrapper.style.zIndex = '-1';
            wrapper.style.pointerEvents = 'none';
            wrapper.style.overflow = 'hidden';
            wrapper.style.background = getComputedStyle(
                document.documentElement,
            ).getPropertyValue('--background-primary');
            wrapper.style.boxSizing = 'border-box';

            const clone = source.cloneNode(true) as HTMLElement;
            if ($whiteThemeMode) {
                clone.classList.add('mandala-white-theme');
            }
            clone.style.margin = '0';
            clone.style.transform = 'none';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.position = 'static';
            clone.style.width = '100%';
            clone.style.height = '100%';
            clone.style.padding = `${squarePadding}px`;
            clone.style.boxSizing = 'border-box';

            wrapper.appendChild(clone);
            document.body.appendChild(wrapper);

            return {
                element: wrapper,
                width: size,
                height: size,
                cleanup: () => wrapper.remove(),
            };
        };

        const getExportTarget = () => {
            if ($a4Mode) {
                return view.contentEl.querySelector(
                    '.mandala-scroll',
                ) as HTMLElement | null;
            }
            if (exportFormat === 'png' && exportSquareSize) {
                return view.contentEl.querySelector(
                    '.mandala-scroll',
                ) as HTMLElement | null;
            }
            return view.contentEl.querySelector(
                '.mandala-content-wrapper',
            ) as HTMLElement | null;
        };

        const target = getExportTarget();
        if (!target) {
            new Notice('未找到可导出的视图区域。');
            return;
        }

        if ($a4Mode) {
            const exportTarget = createA4ExportTarget(target);
            try {
                await exportToPNG(exportTarget.element, {
                    pixelRatio: 2,
                    width: exportTarget.width,
                    height: exportTarget.height,
                });
            } finally {
                exportTarget.cleanup();
            }
            return;
        }

        if (exportFormat === 'png' && exportSquareSize) {
            const exportTarget = createSquarePngExportTarget(target);
            try {
                await exportToPNG(exportTarget.element, {
                    pixelRatio: 2,
                    width: exportTarget.width,
                    height: exportTarget.height,
                });
            } finally {
                exportTarget.cleanup();
            }
            return;
        }

        await exportToPNG(target, { pixelRatio: 2 });
    };

    let exportFormat: 'png' | 'pdf' = 'png';
    let exportSquareSize = false;

    $: if (!$squareLayout && exportSquareSize) {
        exportSquareSize = false;
    }

    $: if (exportFormat !== 'png' && exportSquareSize) {
        exportSquareSize = false;
    }

    const exportCurrentFile = async () => {
        if (exportFormat === 'pdf') {
            await exportCurrentViewPdf();
            return;
        }
        await exportCurrentView();
    };

    const exportCurrentViewPdf = async () => {
        if (!$a4Mode) {
            new Notice('请先切换到 A4 大小再导出 PDF。');
            return;
        }

        const loadingNotice = new Notice('正在导出 PDF...', 0);
        const target = view.contentEl.querySelector(
            '.mandala-scroll',
        ) as HTMLElement | null;
        if (!target) {
            loadingNotice.hide();
            new Notice('未找到可导出的视图区域。');
            closeMenu();
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

        if (!dialog || !webContents?.printToPDF) {
            loadingNotice.hide();
            new Notice('当前环境不支持 PDF 导出。');
            closeMenu();
            return;
        }

        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, '-');
        const defaultName = `mandala-${timestamp}.pdf`;
        const isLandscape = $a4Orientation === 'landscape';
        const pageStyle = document.createElement('style');
        pageStyle.textContent = `@page { size: A4 ${
            isLandscape ? 'landscape' : 'portrait'
        }; margin: 0; }`;
        document.head.appendChild(pageStyle);

        const createPrintLayer = (
            source: HTMLElement,
            orientation: 'portrait' | 'landscape',
        ) => {
            const computed = getComputedStyle(source);
            const borderColor = computed.getPropertyValue(
                '--mandala-border-color',
            );
            const layer = document.createElement('div');
            layer.className = 'mandala-pdf-export-layer';
            layer.classList.add('mandala-a4-mode');
            if (orientation === 'landscape') {
                layer.classList.add('mandala-a4-landscape');
            }
            layer.style.setProperty('--mandala-border-opacity', `${$borderOpacity}%`);
            if (borderColor.trim().length > 0) {
                layer.style.setProperty('--mandala-border-color', borderColor);
            }
            layer.style.width =
                orientation === 'landscape' ? '297mm' : '210mm';
            layer.style.height =
                orientation === 'landscape' ? '210mm' : '297mm';
            layer.style.padding = '1.27cm';
            layer.style.boxSizing = 'border-box';
            layer.style.background = getComputedStyle(
                document.documentElement,
            ).getPropertyValue('--background-primary');

            const clone = source.cloneNode(true) as HTMLElement;
            if ($whiteThemeMode) {
                clone.classList.add('mandala-white-theme');
            }
            clone.style.margin = '0';
            clone.style.transform = 'none';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.position = 'static';
            clone.style.width = '100%';
            clone.style.height = '100%';
            clone.style.padding = '0';
            clone.style.boxSizing = 'border-box';

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
                const pdfData = await webContents.printToPDF({
                    pageSize: 'A4',
                    landscape: isLandscape,
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
                            }
                            resolve();
                        });
                    });
                }
            });
            printLayer.cleanup();
        } catch (_error) {
            new Notice('导出失败，请稍后再试。');
        } finally {
            pageStyle.remove();
            loadingNotice.hide();
            closeMenu();
        }
    };

    const addPngDpiChunk = (dataUrl: string, dpi: number) => {
        const base64 = dataUrl.split(',')[1] ?? '';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }

        const signature = bytes.slice(0, 8);
        const rest = bytes.slice(8);
        const dpiToPpm = Math.round(dpi * 39.3701);
        const chunkType = new TextEncoder().encode('pHYs');
        const chunkData = new Uint8Array(9);
        const view = new DataView(chunkData.buffer);
        view.setUint32(0, dpiToPpm);
        view.setUint32(4, dpiToPpm);
        chunkData[8] = 1;

        const chunkLength = new Uint8Array(4);
        new DataView(chunkLength.buffer).setUint32(0, chunkData.length);
        const crcData = new Uint8Array(chunkType.length + chunkData.length);
        crcData.set(chunkType, 0);
        crcData.set(chunkData, chunkType.length);
        const crc = crc32(crcData);
        const crcBytes = new Uint8Array(4);
        new DataView(crcBytes.buffer).setUint32(0, crc);

        const pngBytes = new Uint8Array(
            signature.length +
                chunkLength.length +
                chunkType.length +
                chunkData.length +
                crcBytes.length +
                rest.length,
        );
        let offset = 0;
        pngBytes.set(signature, offset);
        offset += signature.length;
        pngBytes.set(chunkLength, offset);
        offset += chunkLength.length;
        pngBytes.set(chunkType, offset);
        offset += chunkType.length;
        pngBytes.set(chunkData, offset);
        offset += chunkData.length;
        pngBytes.set(crcBytes, offset);
        offset += crcBytes.length;
        pngBytes.set(rest, offset);

        const binaryOutput = bytesToBinary(pngBytes);
        const outputBase64 = btoa(binaryOutput);
        return `data:image/png;base64,${outputBase64}`;
    };

    const bytesToBinary = (bytes: Uint8Array) => {
        const chunkSize = 0x8000;
        let result = '';
        for (let i = 0; i < bytes.length; i += chunkSize) {
            result += String.fromCharCode(
                ...bytes.subarray(i, i + chunkSize),
            );
        }
        return result;
    };

    const crc32 = (input: Uint8Array) => {
        let crc = 0xffffffff;
        for (let i = 0; i < input.length; i += 1) {
            crc ^= input[i];
            for (let j = 0; j < 8; j += 1) {
                const mask = -(crc & 1);
                crc = (crc >>> 1) ^ (0xedb88320 & mask);
            }
        }
        return (crc ^ 0xffffffff) >>> 0;
    };

    const clearEmptySubgrids = () => {
        const state = view.documentStore.getValue();
        if (!state.meta.isMandala) {
            new Notice('当前文档不是九宫格格式。');
            closeMenu();
            return;
        }

        const theme = view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
        const centerNodeId = state.sections.section_id[theme];
        if (!centerNodeId) {
            new Notice('未找到当前主题中心格子。');
            closeMenu();
            return;
        }

        view.viewStore.dispatch({
            type: 'view/set-active-node/document',
            payload: { id: centerNodeId },
        });
        view.viewStore.dispatch({
            type: 'view/selection/set-selection',
            payload: { ids: [centerNodeId] },
        });
        view.alignBranch.align({ type: 'view/align-branch/center-node' });

        const plan = createClearEmptyMandalaSubgridsPlan(state.document);
        if (plan.parentIds.length === 0) {
            new Notice('没有可清空的空白九宫格。');
            closeMenu();
            return;
        }

        view.documentStore.dispatch({
            type: 'document/mandala/clear-empty-subgrids',
            payload: { parentIds: plan.parentIds, activeNodeId: centerNodeId },
        });

        new Notice(
            `已清空 ${plan.parentIds.length} 个空白九宫格，删除 ${plan.nodesToRemove.length} 个子格。`,
        );
        closeMenu();
    };

    const getTemplatesFileFromPath = () => {
        if (!$templatesFilePathStore) return null;
        const file = view.plugin.app.vault.getAbstractFileByPath(
            $templatesFilePathStore,
        );
        return file instanceof TFile ? file : null;
    };

    const openTemplatesFileFromPath = async () => {
        const file = getTemplatesFileFromPath();
        if (!file) {
            new Notice('模板文件不存在，请重新指定。');
            return;
        }
        await openFile(view.plugin, file, 'tab');
        closeMenu();
    };

    const pickTemplatesFile = async () => {
        const file = await openMandalaTemplatesFileModal(view.plugin);
        if (!file) return;
        view.plugin.settings.dispatch({
            type: 'settings/general/set-mandala-templates-file-path',
            payload: { path: file.path },
        });
    };

    const ensureTemplatesFile = async () => {
        const existing = getTemplatesFileFromPath();
        if (existing) return existing;
        if ($templatesFilePathStore) {
            new Notice('模板文件不存在，请重新指定。');
            view.plugin.settings.dispatch({
                type: 'settings/general/set-mandala-templates-file-path',
                payload: { path: null },
            });
        }
        const file = await openMandalaTemplatesFileModal(view.plugin);
        if (!file) return null;
        view.plugin.settings.dispatch({
            type: 'settings/general/set-mandala-templates-file-path',
            payload: { path: file.path },
        });
        return file;
    };

    const ensureMandala3x3 = () => {
        if (view.mandalaMode !== '3x3') {
            new Notice('仅支持 3x3 视图。');
            return false;
        }
        const state = view.documentStore.getValue();
        if (!state.meta.isMandala) {
            new Notice('当前文档不是九宫格格式。');
            return false;
        }
        return true;
    };

    const getCurrentThemeSlots = (theme: string) => {
        const state = view.documentStore.getValue();
        const slots: string[] = [];
        for (let i = 1; i <= 8; i += 1) {
            const section = `${theme}.${i}`;
            const nodeId = state.sections.section_id[section];
            const content = nodeId
                ? state.document.content[nodeId]?.content ?? ''
                : '';
            slots.push(content);
        }
        return slots;
    };

    const saveCurrentThemeAsTemplate = async () => {
        if (!ensureMandala3x3()) return;
        const file = await ensureTemplatesFile();
        if (!file) return;
        const templateName = await openMandalaTemplateNameModal(view.plugin);
        if (!templateName) return;

        let raw = '';
        try {
            raw = await view.plugin.app.vault.read(file);
        } catch {
            new Notice('读取模板文件失败。');
            return;
        }
        const templates = parseMandalaTemplates(raw);
        if (templates.some((template) => template.name === templateName)) {
            new Notice('模板名称已存在，请更换名称。');
            return;
        }

        const theme = view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
        const slots = getCurrentThemeSlots(theme);
        const template: MandalaTemplate = { name: templateName, slots };
        const nextContent = appendMandalaTemplate(raw, template);
        try {
            await view.plugin.app.vault.modify(file, nextContent);
        } catch {
            new Notice('写入模板文件失败。');
            return;
        }
        new Notice('模板已保存。');
        closeMenu();
    };

    const applyTemplateToCurrentTheme = async () => {
        if (!ensureMandala3x3()) return;
        const file = await ensureTemplatesFile();
        if (!file) return;

        let raw = '';
        try {
            raw = await view.plugin.app.vault.read(file);
        } catch {
            new Notice('读取模板文件失败。');
            return;
        }
        const templates = parseMandalaTemplates(raw);
        if (templates.length === 0) {
            new Notice('模板文件中没有模板。');
            return;
        }

        const selected = await openMandalaTemplateSelectModal(
            view.plugin,
            templates,
        );
        if (!selected) return;

        const state = view.documentStore.getValue();
        const theme = view.viewStore.getValue().ui.mandala.subgridTheme ?? '1';
        const centerNodeId = state.sections.section_id[theme];
        if (!centerNodeId) {
            new Notice('未找到当前主题中心格子。');
            return;
        }

        view.documentStore.dispatch({
            type: 'document/mandala/ensure-children',
            payload: { parentNodeId: centerNodeId, count: 8 },
        });

        const refreshed = view.documentStore.getValue();
        for (let i = 1; i <= 8; i += 1) {
            const section = `${theme}.${i}`;
            const nodeId = refreshed.sections.section_id[section];
            if (!nodeId) continue;
            view.documentStore.dispatch({
                type: 'document/update-node-content',
                payload: {
                    nodeId,
                    content: selected.slots[i - 1] ?? '',
                },
                context: { isInSidebar: false },
            });
        }

        new Notice('模板已应用。');
        closeMenu();
    };

    const closeMenu = () => {
        dispatch('close');
        showEditOptions = false;
        showPrintOptions = false;
        showTemplateOptions = false;
    };

    // 点击外部关闭菜单 - 使用全局点击事件
    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
            !target.closest('.view-options-menu') &&
            !target.closest('.js-view-options-trigger')
        ) {
            closeMenu();
        }
    };

    $: if (show) {
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
    } else {
        document.removeEventListener('click', handleClickOutside);
    }
</script>

{#if show}
    <div class="view-options-menu">
        <div class="view-options-menu__header">
            <span class="view-options-menu__title">视图选项</span>
            <button
                class="view-options-menu__close"
                on:click={closeMenu}
                aria-label="关闭"
            >
                <X class="icon" size={16} />
            </button>
        </div>
        
        <div class="view-options-menu__items">
            <button
                class="view-options-menu__item"
                on:click={() => (showFontOptions = !showFontOptions)}
            >
                <div class="view-options-menu__icon">
                    <Type class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">字体设置</div>
                    <div class="view-options-menu__desc">
                        对 3x3 视图、9x9 视图、侧边栏的字体进行调整
                    </div>
                </div>
            </button>

            {#if showFontOptions}
                <div class="view-options-menu__submenu">
                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            格子字体大小（PC端）
                        </div>

                        <label class="view-options-menu__row">
                            <span>3x3视图：</span>
                            <div class="view-options-menu__range">
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepFontSize3x3($fontSize3x3, -1)}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="6"
                                    max="36"
                                    step="1"
                                    value={$fontSize3x3}
                                    on:input={updateFontSize3x3}
                                />
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepFontSize3x3($fontSize3x3, 1)}
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min="6"
                                    max="36"
                                    step="1"
                                    value={$fontSize3x3}
                                    on:input={updateFontSize3x3}
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetFontSize3x3}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>

                        <label class="view-options-menu__row">
                            <span>9x9视图：</span>
                            <div class="view-options-menu__range">
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepFontSize9x9($fontSize9x9, -1)}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="6"
                                    max="36"
                                    step="1"
                                    value={$fontSize9x9}
                                    on:input={updateFontSize9x9}
                                />
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepFontSize9x9($fontSize9x9, 1)}
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min="6"
                                    max="36"
                                    step="1"
                                    value={$fontSize9x9}
                                    on:input={updateFontSize9x9}
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetFontSize9x9}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>

                        <label class="view-options-menu__row">
                            <span>侧边栏：</span>
                            <div class="view-options-menu__range">
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepFontSizeSidebar(
                                            $fontSizeSidebar,
                                            -1,
                                        )}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="6"
                                    max="36"
                                    step="1"
                                    value={$fontSizeSidebar}
                                    on:input={updateFontSizeSidebar}
                                />
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepFontSizeSidebar(
                                            $fontSizeSidebar,
                                            1,
                                        )}
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min="6"
                                    max="36"
                                    step="1"
                                    value={$fontSizeSidebar}
                                    on:input={updateFontSizeSidebar}
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetFontSizeSidebar}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>
                    </div>

                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            标题字体大小（em）（可理解为正文字体的放大倍数）
                        </div>
                        <label class="view-options-menu__row">
                            <span>H1</span>
                            <div class="view-options-menu__range">
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepHeadingsFontSize(
                                            $headingsFontSizeEm,
                                            -0.1,
                                        )}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="1"
                                    max="4"
                                    step="0.1"
                                    value={$headingsFontSizeEm}
                                    on:input={updateHeadingsFontSize}
                                />
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() =>
                                        stepHeadingsFontSize(
                                            $headingsFontSizeEm,
                                            0.1,
                                        )}
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max="4"
                                    step="0.1"
                                    value={$headingsFontSizeEm}
                                    on:input={updateHeadingsFontSize}
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetHeadingsFontSize}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>
                    </div>
                </div>
            {/if}

            <button
                class="view-options-menu__item"
                on:click={() => (showEditOptions = !showEditOptions)}
            >
                <div class="view-options-menu__icon">
                    <Grid3x3 class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">编辑模式</div>
                    <div class="view-options-menu__desc">背景与布局</div>
                </div>
            </button>

            {#if showEditOptions}
                <div class="view-options-menu__submenu">
                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            格子风格
                        </div>
                        <div class="view-options-menu__row view-options-menu__row--inline">
                            <div class="view-options-menu__inline-group">
                                <label class="view-options-menu__inline-option">
                                    <input
                                        type="radio"
                                        name="mandala-background"
                                        checked={!$whiteThemeMode}
                                        on:change={() =>
                                            updateWhiteThemeMode(false)}
                                    />
                                    <span>卡片风格，沉浸模式</span>
                                </label>
                                <button
                                    class="view-options-menu__inline-toggle"
                                    type="button"
                                    on:click|stopPropagation={toggleImmersiveOptions}
                                    disabled={$whiteThemeMode}
                                    aria-label="展开沉浸模式设置"
                                >
                                    <Settings size={14} />
                                </button>
                            </div>
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-background"
                                    checked={$whiteThemeMode}
                                    on:change={() => updateWhiteThemeMode(true)}
                                />
                                <span>表格风格，全景模式</span>
                            </label>
                            <button
                                class="view-options-menu__inline-toggle"
                                type="button"
                                on:click|stopPropagation={togglePanoramaOptions}
                                disabled={!$whiteThemeMode}
                                aria-label="展开全景模式设置"
                            >
                                <Settings size={14} />
                            </button>
                        </div>

                        {#if !$whiteThemeMode && showImmersiveOptions}
                            <div class="view-options-menu__submenu view-options-menu__submenu--nested">
                                <div class="view-options-menu__subsection">
                                    <label class="view-options-menu__row">
                                        <span>网格容器背景颜色</span>
                                        <div class="view-options-menu__row-controls">
                                            <input
                                                type="color"
                                                value={$containerBg}
                                                on:input={updateContainerBg}
                                            />
                                            <button
                                                class="view-options-menu__reset"
                                                type="button"
                                                on:click={resetContainerBg}
                                                aria-label="重置为默认"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </label>
                                    <label class="view-options-menu__row">
                                        <span>活跃格子背景颜色</span>
                                        <div class="view-options-menu__row-controls">
                                            <input
                                                type="color"
                                                value={$activeBranchBg}
                                                on:input={updateActiveBranchBg}
                                            />
                                            <button
                                                class="view-options-menu__reset"
                                                type="button"
                                                on:click={resetActiveBranchBg}
                                                aria-label="重置为默认"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </label>
                                    <label class="view-options-menu__row">
                                        <span>活跃格子文字颜色</span>
                                        <div class="view-options-menu__row-controls">
                                            <input
                                                type="color"
                                                value={$activeBranchColor}
                                                on:input={updateActiveBranchColor}
                                            />
                                            <button
                                                class="view-options-menu__reset"
                                                type="button"
                                                on:click={resetActiveBranchColor}
                                                aria-label="重置为默认"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </label>
                                    <label class="view-options-menu__row">
                                        <span>非活跃格子透明度</span>
                                        <div class="view-options-menu__range">
                                            <button
                                                class="view-options-menu__range-step"
                                                type="button"
                                                on:click={() =>
                                                    stepInactiveOpacity(
                                                        $inactiveNodeOpacity,
                                                        -5,
                                                    )}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={$inactiveNodeOpacity}
                                                on:input={updateInactiveNodeOpacity}
                                            />
                                            <button
                                                class="view-options-menu__range-step"
                                                type="button"
                                                on:click={() =>
                                                    stepInactiveOpacity(
                                                        $inactiveNodeOpacity,
                                                        5,
                                                    )}
                                            >
                                                +
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={$inactiveNodeOpacity}
                                                on:input={updateInactiveNodeOpacity}
                                            />
                                            <button
                                                class="view-options-menu__reset"
                                                type="button"
                                                on:click={resetInactiveNodeOpacity}
                                                aria-label="重置为默认"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        {/if}

                        {#if $whiteThemeMode && showPanoramaOptions}
                            <div class="view-options-menu__submenu view-options-menu__submenu--nested">
                                <div class="view-options-menu__subsection">
                                    <div class="view-options-menu__subsection-title">
                                        线框选项
                                    </div>
                                    <label class="view-options-menu__row">
                                        <span>线框透明度</span>
                                        <div class="view-options-menu__range">
                                            <button
                                                class="view-options-menu__range-step"
                                                type="button"
                                                on:click={() =>
                                                    stepBorderOpacity(
                                                        $borderOpacity,
                                                        -5,
                                                    )}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={$borderOpacity}
                                                on:input={updateBorderOpacity}
                                            />
                                            <button
                                                class="view-options-menu__range-step"
                                                type="button"
                                                on:click={() =>
                                                    stepBorderOpacity(
                                                        $borderOpacity,
                                                        5,
                                                    )}
                                            >
                                                +
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={$borderOpacity}
                                                on:input={updateBorderOpacity}
                                            />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        {/if}
                    </div>

                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            背景色选项
                        </div>
                        <div class="view-options-menu__row view-options-menu__row--inline">
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-background-color"
                                    checked={$backgroundMode === 'none'}
                                    on:change={() =>
                                        updateBackgroundMode('none')}
                                />
                                <span>无背景色</span>
                            </label>
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-background-color"
                                    checked={$backgroundMode === 'custom'}
                                    on:change={() =>
                                        updateBackgroundMode('custom')}
                                />
                                <span>色块卡片</span>
                            </label>
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-background-color"
                                    checked={$backgroundMode === 'gray'}
                                    on:change={() =>
                                        updateBackgroundMode('gray')}
                                />
                                <span>间隔灰色色块</span>
                            </label>
                        </div>
                        <label class="view-options-menu__row">
                            <span>背景色透明度</span>
                            <div class="view-options-menu__range">
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    disabled={$backgroundMode === 'none'}
                                    on:click={() =>
                                        stepOpacity($sectionColorOpacity, -5)}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={$sectionColorOpacity}
                                    on:input={updateSectionColorOpacity}
                                    disabled={$backgroundMode === 'none'}
                                />
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    disabled={$backgroundMode === 'none'}
                                    on:click={() =>
                                        stepOpacity($sectionColorOpacity, 5)}
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={$sectionColorOpacity}
                                    on:input={updateSectionColorOpacity}
                                    disabled={$backgroundMode === 'none'}
                                />
                            </div>
                        </label>
                    </div>

                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            格子形状布局
                        </div>
                        <div class="view-options-menu__row view-options-menu__row--inline">
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-square-layout"
                                    checked={!$squareLayout}
                                    on:change={() =>
                                        updateSquareLayout(false)}
                                />
                                <span>自适应布局</span>
                            </label>
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-square-layout"
                                    checked={$squareLayout}
                                    on:change={() =>
                                        updateSquareLayout(true)}
                                />
                                <span>正方形布局</span>
                            </label>
                        </div>
                        <label class="view-options-menu__row">
                            <span>网格间距</span>
                            <div class="view-options-menu__range">
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() => stepCardsGap($cardsGap, -2)}
                                >
                                    -
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    step="2"
                                    value={$cardsGap}
                                    on:input={updateCardsGap}
                                />
                                <button
                                    class="view-options-menu__range-step"
                                    type="button"
                                    on:click={() => stepCardsGap($cardsGap, 2)}
                                >
                                    +
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="2"
                                    value={$cardsGap}
                                    on:input={updateCardsGap}
                                />
                                <button
                                    class="view-options-menu__reset"
                                    type="button"
                                    on:click={resetCardsGap}
                                    aria-label="重置为默认"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </label>
                    </div>

                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            九宫格方位布局
                        </div>
                        <div class="view-options-menu__row view-options-menu__row--inline">
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-grid-orientation"
                                    checked={$gridOrientation === 'south-start'}
                                    on:change={() =>
                                        updateGridOrientation('south-start')}
                                />
                                <span>从南开始</span>
                            </label>
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-grid-orientation"
                                    checked={$gridOrientation === 'left-to-right'}
                                    on:change={() =>
                                        updateGridOrientation(
                                            'left-to-right',
                                        )}
                                />
                                <span>从左到右（Z形）</span>
                            </label>
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-grid-orientation"
                                    checked={$gridOrientation === 'bottom-to-top'}
                                    on:change={() =>
                                        updateGridOrientation(
                                            'bottom-to-top',
                                        )}
                                />
                                <span>从下到上（S形）</span>
                            </label>
                        </div>
                    </div>
                </div>
            {/if}

            <button
                class="view-options-menu__item"
                on:click={() => (showPrintOptions = !showPrintOptions)}
            >
                <div class="view-options-menu__icon">
                    <Printer class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">导出模式</div>
                    <div class="view-options-menu__desc">
                        可按自定义页面大小进行导出
                    </div>
                </div>
            </button>

            {#if showPrintOptions}
                <div class="view-options-menu__submenu">
                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            导出分享用 PNG
                        </div>
                        <div class="view-options-menu__row view-options-menu__row--inline">
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-export-mode-png"
                                    checked={!$a4Mode && exportSquareSize}
                                    on:change={() => {
                                        exportFormat = 'png';
                                        enableSquareExport();
                                    }}
                                />
                                <span>仅导出正方形九宫格</span>
                            </label>
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-export-mode-png"
                                    checked={!$a4Mode && !exportSquareSize}
                                    on:change={() => {
                                        exportFormat = 'png';
                                        updateExportViewSize('screen');
                                    }}
                                />
                                <span>导出屏幕视图内容，可包含侧边栏</span>
                            </label>
                        </div>
                    </div>

                    <div class="view-options-menu__subsection">
                        <div class="view-options-menu__subsection-title">
                            导出打印用 PDF
                        </div>
                        <div class="view-options-menu__row view-options-menu__row--inline">
                            <label class="view-options-menu__inline-option">
                                <input
                                    type="radio"
                                    name="mandala-export-mode-pdf"
                                    checked={$a4Mode}
                                    on:change={() => {
                                        exportFormat = 'pdf';
                                        updateExportViewSize('a4');
                                    }}
                                />
                                <span>导出 A4 打印页面（推荐表格风格）</span>
                            </label>
                        </div>
                    </div>
                    <button
                        class="view-options-menu__subitem"
                        on:click={exportCurrentFile}
                    >
                        导出文件
                    </button>
                </div>
            {/if}

            <button
                class="view-options-menu__item"
                on:click={() => (showTemplateOptions = !showTemplateOptions)}
            >
                <div class="view-options-menu__icon">
                    <Frame class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">九宫格模板</div>
                    <div class="view-options-menu__desc">
                        保存与应用周边八格
                    </div>
                </div>
            </button>

            {#if showTemplateOptions}
                <div class="view-options-menu__submenu">
                    <div class="view-options-menu__subsection">
                        <button
                            class="view-options-menu__subitem"
                            on:click={pickTemplatesFile}
                        >
                            指定模板文件
                        </button>
                        <button
                            class="view-options-menu__path"
                            on:click={openTemplatesFileFromPath}
                            disabled={!$templatesFilePathStore}
                            title={$templatesFilePathStore ?? '未指定'}
                        >
                            模板文件：
                            {$templatesFilePathStore ?? '未指定'}
                        </button>
                    </div>
                    <div class="view-options-menu__row view-options-menu__row--inline">
                        <button
                            class="view-options-menu__subitem"
                            on:click={saveCurrentThemeAsTemplate}
                        >
                            保存当前九宫格为模板
                        </button>
                        <button
                            class="view-options-menu__subitem"
                            on:click={applyTemplateToCurrentTheme}
                        >
                            将模板应用到当前九宫格
                        </button>
                    </div>
                </div>
            {/if}

            <button class="view-options-menu__item" on:click={clearEmptySubgrids}>
                <div class="view-options-menu__icon">
                    <Trash2 class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">清空空白九宫格</div>
                    <div class="view-options-menu__desc">
                        删除空白子主题分支，保留中心格
                    </div>
                </div>
            </button>
        </div>
    </div>
{/if}

<style>
    .view-options-menu {
        position: absolute;
        top: 48px;
        right: 8px;
        min-width: 260px;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        overflow: hidden;
        z-index: 1000;
        /* 使用轻量级阴影提升可视性 */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }

    :global(.is-mobile) .view-options-menu {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        min-width: 0;
        border-radius: 0;
        z-index: 1003;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
    }

    .view-options-menu__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
    }

    .view-options-menu__title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-normal);
    }

    .view-options-menu__close {
        background: transparent;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
    }

    .view-options-menu__close:hover {
        background: var(--background-modifier-hover);
        color: var(--text-normal);
    }

    .view-options-menu__items {
        padding: 6px;
    }

    :global(.is-mobile) .view-options-menu__items {
        padding-bottom: 20px;
    }

    .view-options-menu__submenu {
        margin: 6px;
        padding: 8px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        background: var(--background-secondary);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .view-options-menu__submenu--nested {
        margin: 0;
        background: var(--background-primary);
    }

    .view-options-menu__subitem {
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        padding: 6px 8px;
        cursor: pointer;
        text-align: left;
    }

    .view-options-menu__path {
        padding: 0;
        border: none;
        background: transparent;
        font-size: 11px;
        color: var(--text-muted);
        text-align: left;
        cursor: pointer;
        line-height: 1.4;
    }

    .view-options-menu__path:disabled {
        cursor: default;
        opacity: 0.6;
    }

    .view-options-menu__path:not(:disabled):hover {
        color: var(--text-normal);
        text-decoration: underline;
    }

    .view-options-menu__subsection {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: 8px;
        border-top: 1px solid var(--background-modifier-border);
    }

    .view-options-menu__subsection:first-child {
        padding-top: 0;
        border-top: none;
    }

    .view-options-menu__subsection-title {
        font-size: 12px;
        color: var(--text-accent);
        margin-bottom: 2px;
    }

    .view-options-menu__inline-group {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .view-options-menu__inline-toggle {
        border: none;
        background: transparent;
        color: var(--text-muted);
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        outline: none;
        box-shadow: none;
    }

    .view-options-menu__inline-toggle:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .view-options-menu__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
        color: var(--text-normal);
    }

    :global(.is-mobile) .view-options-menu__row {
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 6px;
    }

    :global(.is-mobile) .view-options-menu__row > span {
        flex: 0 0 auto;
        white-space: normal;
        line-height: 1.3;
    }

    .view-options-menu__row--inline {
        justify-content: flex-start;
        gap: 16px;
        flex-wrap: wrap;
    }

    .view-options-menu__inline-option {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .view-options-menu__note {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.3;
    }

    .view-options-menu__row select,
    .view-options-menu__row input[type='range'] {
        flex: 1 1 auto;
    }

    .view-options-menu__row-controls {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    :global(.is-mobile) .view-options-menu__row-controls {
        justify-content: flex-end;
    }

    .view-options-menu__row input[type='color'] {
        width: 28px;
        height: 20px;
        padding: 0;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background: transparent;
        appearance: none;
        -webkit-appearance: none;
    }

    .view-options-menu__reset {
        width: 22px;
        height: 22px;
        padding: 0;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }

    .view-options-menu__reset:hover {
        color: var(--text-normal);
    }

    .view-options-menu__range {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    :global(.is-mobile) .view-options-menu__range {
        display: grid;
        grid-template-columns: 32px 1fr 32px 64px 32px;
        gap: 8px;
        align-items: center;
    }

    .view-options-menu__range-step {
        width: 22px;
        height: 22px;
        padding: 0;
        border-radius: 4px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        cursor: pointer;
        line-height: 1;
    }

    .view-options-menu__range-step:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .view-options-menu__range input[type='range'] {
        flex: 1 1 auto;
    }

    .view-options-menu__range input[type='number'] {
        width: 56px;
        padding: 2px 4px;
        text-align: center;
    }

    :global(.is-mobile) .view-options-menu__range-step,
    :global(.is-mobile) .view-options-menu__reset {
        width: 32px;
        height: 32px;
    }

    :global(.is-mobile) .view-options-menu__range input[type='number'] {
        width: 64px;
        height: 32px;
        padding: 0 6px;
        box-sizing: border-box;
    }

    .view-options-menu__item {
        width: 100%;
        display: flex !important;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 12px;
        min-height: 44px;
        height: auto !important;
        border: none !important;
        background: transparent !important;
        cursor: pointer;
        border-radius: 4px;
        text-align: left;
        box-sizing: border-box;
        overflow: hidden;
    }

    .view-options-menu__item:hover {
        background: var(--background-modifier-hover);
    }

    .view-options-menu__item:active {
        background: var(--background-modifier-active-hover);
    }

    .view-options-menu__item + .view-options-menu__item {
        margin-top: 4px;
    }

    .view-options-menu__icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .view-options-menu__icon-svg {
        color: var(--text-accent);
    }

    .view-options-menu__content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .view-options-menu__label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-normal);
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .view-options-menu__desc {
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
