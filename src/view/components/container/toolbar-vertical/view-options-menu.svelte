<script lang="ts">
    import { getView } from 'src/view/components/container/context';
    import { Trash2, X } from 'lucide-svelte';
    import { Keyboard } from 'lucide-svelte';
    import { Notice, Platform, TFile, btoa } from 'obsidian';
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
        MandalaFontSize3x3MobileStore,
        MandalaFontSize9x9DesktopStore,
        MandalaFontSize9x9MobileStore,
        MandalaFontSizeSidebarDesktopStore,
        MandalaFontSizeSidebarMobileStore,
        MandalaGridOrientationStore,
        MandalaSectionColorOpacityStore,
        Show3x3SubgridNavButtonsStore,
        Show9x9ParallelNavButtonsStore,
        ShowHiddenCardInfoStore,
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
    import ViewOptionsFontPanel from './components/view-options-font-panel.svelte';
    import ViewOptionsDisplayPanel from './components/view-options-display-panel.svelte';
    import ViewOptionsEditPanel from './components/view-options-edit-panel.svelte';
    import ViewOptionsExportPanel from './components/view-options-export-panel.svelte';
    import ViewOptionsTemplatePanel from './components/view-options-template-panel.svelte';

    const dispatch = createEventDispatcher<{ close: void }>();
    const view = getView();
    const isMobile = Platform.isMobile;

    export let show = false;
    let showEditOptions = false;
    let showFontOptions = false;
    let showDisplayOptions = false;
    let showPrintOptions = false;
    let showTemplateOptions = false;
    let mobileBoundsStyle = '';
    let listenersAttached = false;

    const a4Mode = MandalaA4ModeStore(view);
    const a4Orientation = MandalaA4OrientationStore(view);
    const borderOpacity = MandalaBorderOpacityStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);
    const squareLayout = SquareLayoutStore(view);
    const gridOrientation = MandalaGridOrientationStore(view);
    const show3x3SubgridNavButtons = Show3x3SubgridNavButtonsStore(view);
    const show9x9ParallelNavButtons = Show9x9ParallelNavButtonsStore(view);
    const showHiddenCardInfo = ShowHiddenCardInfoStore(view);
    const themeDefaults = getDefaultTheme();
    const cardsGap = derived(
        view.plugin.settings,
        (state) => state.view.cardsGap,
    );
    const fontSize3x3 = isMobile
        ? MandalaFontSize3x3MobileStore(view)
        : MandalaFontSize3x3DesktopStore(view);
    const fontSize9x9 = isMobile
        ? MandalaFontSize9x9MobileStore(view)
        : MandalaFontSize9x9DesktopStore(view);
    const fontSizeSidebar = isMobile
        ? MandalaFontSizeSidebarMobileStore(view)
        : MandalaFontSizeSidebarDesktopStore(view);
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
        (state) =>
            state.view.theme.activeBranchBg ?? themeDefaults.activeBranchBg,
    );
    const activeBranchColor = derived(
        view.plugin.settings,
        (state) =>
            state.view.theme.activeBranchColor ??
            themeDefaults.activeBranchColor,
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

    const toggleHiddenCardInfo = () => {
        view.plugin.settings.dispatch({
            type: 'settings/view/toggle-hidden-card-info',
        });
    };

    const toggle9x9ParallelNavButtons = () => {
        view.plugin.settings.dispatch({
            type: isMobile
                ? 'settings/view/toggle-9x9-parallel-nav-buttons-mobile'
                : 'settings/view/toggle-9x9-parallel-nav-buttons-desktop',
        });
    };

    const toggle3x3SubgridNavButtons = () => {
        view.plugin.settings.dispatch({
            type: isMobile
                ? 'settings/view/toggle-3x3-subgrid-nav-buttons-mobile'
                : 'settings/view/toggle-3x3-subgrid-nav-buttons-desktop',
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

    type ExportMode = 'png-square' | 'png-screen' | 'pdf-a4';
    let exportMode: ExportMode = 'png-screen';

    const setExportMode = (mode: ExportMode) => {
        exportMode = mode;

        if (mode === 'pdf-a4') {
            updateA4Mode(true);
            return;
        }

        updateA4Mode(false);
        if (mode === 'png-square') {
            updateSquareLayout(true);
        }
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
    const roundToDecimal = (value: number, decimalPlaces: number) =>
        Math.round(value * Math.pow(10, decimalPlaces)) /
        Math.pow(10, decimalPlaces);

    const updateCardsGapValue = (value: number) => {
        view.plugin.settings.dispatch({
            type: 'settings/view/layout/set-cards-gap',
            payload: { gap: clampGap(value) },
        });
    };

    const createPlatformFontSizeUpdater = (
        desktopType:
            | 'settings/view/font-size/set-3x3-desktop'
            | 'settings/view/font-size/set-9x9-desktop'
            | 'settings/view/font-size/set-sidebar-desktop',
        mobileType:
            | 'settings/view/font-size/set-3x3-mobile'
            | 'settings/view/font-size/set-9x9-mobile'
            | 'settings/view/font-size/set-sidebar-mobile',
    ) => {
        return (value: number) => {
            view.plugin.settings.dispatch({
                type: isMobile ? mobileType : desktopType,
                payload: { fontSize: clampFontSize(value) },
            });
        };
    };

    const updateFontSize3x3Value = createPlatformFontSizeUpdater(
        'settings/view/font-size/set-3x3-desktop',
        'settings/view/font-size/set-3x3-mobile',
    );

    const updateFontSize9x9Value = createPlatformFontSizeUpdater(
        'settings/view/font-size/set-9x9-desktop',
        'settings/view/font-size/set-9x9-mobile',
    );

    const updateFontSizeSidebarValue = createPlatformFontSizeUpdater(
        'settings/view/font-size/set-sidebar-desktop',
        'settings/view/font-size/set-sidebar-mobile',
    );

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

    const parseFiniteNumber = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        const value = Number(trimmed);
        return Number.isFinite(value) ? value : null;
    };

    const parseFiniteFloat = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        const value = Number.parseFloat(trimmed);
        return Number.isFinite(value) ? value : null;
    };

    const createNumericInputHandler = (
        applyValue: (value: number) => void,
        parseValue: (raw: string) => number | null = parseFiniteNumber,
    ) => {
        return (event: Event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) return;
            const value = parseValue(target.value);
            if (value === null) return;
            applyValue(value);
        };
    };

    const createStepHandler = (
        applyValue: (value: number) => void,
        decimalPlaces?: number,
    ) => {
        return (current: number, delta: number) => {
            const next =
                decimalPlaces === undefined
                    ? current + delta
                    : roundToDecimal(current + delta, decimalPlaces);
            applyValue(next);
        };
    };

    const updateBorderOpacity = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        const value = parseFiniteNumber(target.value);
        if (value === null) return;
        updateBorderOpacityValue(value);
    };

    const updateSectionColorOpacity = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        const value = parseFiniteNumber(target.value);
        if (value === null) return;
        updateSectionColorOpacityValue(value);
    };

    const updateInactiveNodeOpacity = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        const value = parseFiniteNumber(target.value);
        if (value === null) return;
        updateInactiveNodeOpacityValue(value);
    };

    const updateCardsGap = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        const value = parseFiniteNumber(target.value);
        if (value === null) return;
        updateCardsGapValue(value);
    };

    const updateFontSize3x3 = createNumericInputHandler(updateFontSize3x3Value);
    const updateFontSize9x9 = createNumericInputHandler(updateFontSize9x9Value);
    const updateFontSizeSidebar = createNumericInputHandler(
        updateFontSizeSidebarValue,
    );
    const updateHeadingsFontSize = createNumericInputHandler(
        updateHeadingsFontSizeValue,
        parseFiniteFloat,
    );

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

    const stepFontSize3x3 = createStepHandler(updateFontSize3x3Value);
    const stepFontSize9x9 = createStepHandler(updateFontSize9x9Value);
    const stepFontSizeSidebar = createStepHandler(updateFontSizeSidebarValue);
    const stepHeadingsFontSize = createStepHandler(
        updateHeadingsFontSizeValue,
        1,
    );

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

    type PrintConfig = {
        exportMode: ExportMode;
        a4Orientation: 'portrait' | 'landscape';
        backgroundMode: 'none' | 'custom' | 'gray';
        sectionColorOpacity: number;
        borderOpacity: number;
        whiteThemeMode: boolean;
    };

    let lastPrintConfig: PrintConfig | null = null;

    const capturePrintConfig = () => {
        lastPrintConfig = {
            exportMode,
            a4Orientation: $a4Orientation,
            backgroundMode: $backgroundMode,
            sectionColorOpacity: $sectionColorOpacity,
            borderOpacity: $borderOpacity,
            whiteThemeMode: $whiteThemeMode,
        };
    };

    const applyPrintConfig = (config: PrintConfig) => {
        setExportMode(config.exportMode);
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
            exportMode,
            a4Orientation: $a4Orientation,
            backgroundMode: $backgroundMode,
            sectionColorOpacity: $sectionColorOpacity,
            borderOpacity: $borderOpacity,
            whiteThemeMode: $whiteThemeMode,
        };
        applyPrintConfig(lastPrintConfig);
        lastPrintConfig = current;
    };

    const restoreEditMode = () => {
        capturePrintConfig();
        setExportMode('png-screen');
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

    const applyCssVariables = (element: HTMLElement, vars: Record<string, string>) => {
        element.setCssProps(vars);
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
            if ($whiteThemeMode) {
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

        if (mode === 'png-square') {
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

    $: if ($a4Mode && exportMode !== 'pdf-a4') {
        exportMode = 'pdf-a4';
    }

    $: if (!$a4Mode && exportMode === 'pdf-a4') {
        exportMode = 'png-screen';
    }

    const exportCurrentFile = async () => {
        if (isMobile) {
            new Notice('移动端不支持导出，请在桌面端操作');
            return;
        }
        if (exportMode === 'pdf-a4') {
            await exportCurrentViewPdf();
            return;
        }
        await exportCurrentView(exportMode);
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

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
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
            if ($squareLayout) {
                layer.classList.add('is-desktop-square-layout');
            }
            applyInlineStyles(layer, {
                ['--mandala-border-opacity' as keyof CSSStyleDeclaration]:
                    `${$borderOpacity}%`,
            });
            if (borderColor.trim().length > 0) {
                applyInlineStyles(layer, {
                    ['--mandala-border-color' as keyof CSSStyleDeclaration]:
                        borderColor,
                });
            }
            applyInlineStyles(layer, {
                width: orientation === 'landscape' ? '297mm' : '210mm',
                height: orientation === 'landscape' ? '210mm' : '297mm',
                padding: '1.27cm',
                boxSizing: 'border-box',
                background: getComputedStyle(
                    document.documentElement,
                ).getPropertyValue('--background-primary'),
            });

            const clone = source.cloneNode(true) as HTMLElement;
            if ($whiteThemeMode) {
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
            result += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
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
        showFontOptions = false;
        showDisplayOptions = false;
        showPrintOptions = false;
        showTemplateOptions = false;
        showImmersiveOptions = false;
        showPanoramaOptions = false;
    };

    const openHotkeysModal = () => {
        view.viewStore.dispatch({ type: 'view/hotkeys/toggle-modal' });
        closeMenu();
    };

    const getVisibleViewport = () => {
        const vv = window.visualViewport;
        if (!vv) {
            return {
                left: 0,
                top: 0,
                right: window.innerWidth,
                bottom: window.innerHeight,
            };
        }
        return {
            left: vv.offsetLeft,
            top: vv.offsetTop,
            right: vv.offsetLeft + vv.width,
            bottom: vv.offsetTop + vv.height,
        };
    };

    const updateMobileBoundsStyle = () => {
        if (!isMobile || !show) {
            mobileBoundsStyle = '';
            return;
        }

        const visibleViewport = getVisibleViewport();
        const padding = 8;
        const visualViewport = window.visualViewport;
        const keyboardLikelyOpen =
            !!visualViewport &&
            visualViewport.height < window.innerHeight * 0.85;

        let left = Math.max(0, visibleViewport.left + padding);
        let top = Math.max(0, visibleViewport.top + padding);
        let width = Math.max(260, visibleViewport.right - visibleViewport.left - padding * 2);
        let height = Math.max(220, visibleViewport.bottom - visibleViewport.top - padding * 2);

        if (!keyboardLikelyOpen) {
            const rect = view.contentEl.getBoundingClientRect();
            const boundedLeft = Math.max(rect.left, visibleViewport.left);
            const boundedTop = Math.max(rect.top, visibleViewport.top);
            const boundedRight = Math.min(rect.right, visibleViewport.right);
            const boundedBottom = Math.min(rect.bottom, visibleViewport.bottom);

            left = Math.max(0, boundedLeft + padding);
            top = Math.max(0, boundedTop + padding);
            width = Math.max(260, boundedRight - boundedLeft - padding * 2);
            height = Math.max(220, boundedBottom - boundedTop - padding * 2);
        }

        mobileBoundsStyle = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
    };

    const handleViewportChange = () => {
        updateMobileBoundsStyle();
        requestAnimationFrame(() => {
            updateMobileBoundsStyle();
        });
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

    $: if (show && !listenersAttached) {
        listenersAttached = true;
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
            window.addEventListener('resize', handleViewportChange);
            window.addEventListener('orientationchange', handleViewportChange);
            window.visualViewport?.addEventListener(
                'resize',
                handleViewportChange,
            );
            window.visualViewport?.addEventListener(
                'scroll',
                handleViewportChange,
            );
            document.addEventListener('focusin', handleViewportChange, true);
            handleViewportChange();
        }, 0);
    } else if (!show && listenersAttached) {
        listenersAttached = false;
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleViewportChange);
        window.visualViewport?.removeEventListener(
            'resize',
            handleViewportChange,
        );
        window.visualViewport?.removeEventListener(
            'scroll',
            handleViewportChange,
        );
        document.removeEventListener('focusin', handleViewportChange, true);
        mobileBoundsStyle = '';
    }
</script>

{#if show}
    <div
        class="mandala-modal view-options-menu"
        class:is-mobile={isMobile}
        style={isMobile ? mobileBoundsStyle : undefined}
        on:mousedown|stopPropagation
        on:touchstart|stopPropagation
    >
        {#if isMobile}
            <div class="mobile-modal-header">
                <div class="mobile-modal-title">视图选项</div>
                <button
                    class="mobile-done-button"
                    on:click={closeMenu}
                    aria-label="关闭视图选项"
                >
                    <X size={18} />
                    <span>关闭</span>
                </button>
            </div>
        {:else}
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
        {/if}
        <div class="view-options-menu__items">
            <ViewOptionsEditPanel
                show={showEditOptions}
                whiteThemeMode={$whiteThemeMode}
                {showImmersiveOptions}
                {showPanoramaOptions}
                containerBg={$containerBg}
                activeBranchBg={$activeBranchBg}
                activeBranchColor={$activeBranchColor}
                inactiveNodeOpacity={$inactiveNodeOpacity}
                borderOpacity={$borderOpacity}
                backgroundMode={$backgroundMode}
                sectionColorOpacity={$sectionColorOpacity}
                squareLayout={$squareLayout}
                cardsGap={$cardsGap}
                gridOrientation={$gridOrientation}
                toggle={() => (showEditOptions = !showEditOptions)}
                {updateWhiteThemeMode}
                {toggleImmersiveOptions}
                {togglePanoramaOptions}
                {updateContainerBg}
                {resetContainerBg}
                {updateActiveBranchBg}
                {resetActiveBranchBg}
                {updateActiveBranchColor}
                {resetActiveBranchColor}
                {stepInactiveOpacity}
                {updateInactiveNodeOpacity}
                {resetInactiveNodeOpacity}
                {stepBorderOpacity}
                {updateBorderOpacity}
                {updateBackgroundMode}
                {stepOpacity}
                {updateSectionColorOpacity}
                {updateSquareLayout}
                {stepCardsGap}
                {updateCardsGap}
                {resetCardsGap}
                {updateGridOrientation}
            />

            <ViewOptionsDisplayPanel
                show={showDisplayOptions}
                showHiddenCardInfo={$showHiddenCardInfo}
                show3x3SubgridNavButtons={$show3x3SubgridNavButtons}
                show9x9ParallelNavButtons={$show9x9ParallelNavButtons}
                toggle={() => (showDisplayOptions = !showDisplayOptions)}
                {toggleHiddenCardInfo}
                {toggle3x3SubgridNavButtons}
                {toggle9x9ParallelNavButtons}
            />

            <ViewOptionsFontPanel
                {isMobile}
                show={showFontOptions}
                fontSize3x3={$fontSize3x3}
                fontSize9x9={$fontSize9x9}
                fontSizeSidebar={$fontSizeSidebar}
                headingsFontSizeEm={$headingsFontSizeEm}
                toggle={() => (showFontOptions = !showFontOptions)}
                {stepFontSize3x3}
                {updateFontSize3x3}
                {resetFontSize3x3}
                {stepFontSize9x9}
                {updateFontSize9x9}
                {resetFontSize9x9}
                {stepFontSizeSidebar}
                {updateFontSizeSidebar}
                {resetFontSizeSidebar}
                {stepHeadingsFontSize}
                {updateHeadingsFontSize}
                {resetHeadingsFontSize}
            />

            <button class="view-options-menu__item" on:click={openHotkeysModal}>
                <div class="view-options-menu__icon">
                    <Keyboard class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">快捷键设置</div>
                    <div class="view-options-menu__desc">打开快捷键设置面板</div>
                </div>
            </button>

            <ViewOptionsTemplatePanel
                show={showTemplateOptions}
                templatesFilePath={$templatesFilePathStore}
                toggle={() => (showTemplateOptions = !showTemplateOptions)}
                {pickTemplatesFile}
                {openTemplatesFileFromPath}
                {saveCurrentThemeAsTemplate}
                {applyTemplateToCurrentTheme}
            />

            <ViewOptionsExportPanel
                {isMobile}
                show={showPrintOptions}
                {exportMode}
                toggle={() => (showPrintOptions = !showPrintOptions)}
                setPngSquareMode={() => setExportMode('png-square')}
                setPngScreenMode={() => setExportMode('png-screen')}
                setPdfMode={() => setExportMode('pdf-a4')}
                {exportCurrentFile}
            />

            <button
                class="view-options-menu__item"
                on:click={clearEmptySubgrids}
            >
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
