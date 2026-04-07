<script lang="ts">
    import { getView } from 'src/mandala-scenes/shared/shell/context';
    import { Printer, Settings2, Trash2, X } from 'lucide-svelte';
    import { Keyboard } from 'lucide-svelte';
    import { Notice, Platform } from 'obsidian';
    import {
        afterUpdate,
        createEventDispatcher,
        onDestroy,
        onMount,
    } from 'svelte';
    import { derived } from 'src/shared/store/derived';
    import {
        ContextMenuCopyLinkVisibilityStore,
        DetailSidebarPreviewModeStore,
        DayPlanEnabledStore,
        MandalaA4ModeStore,
        MandalaA4OrientationStore,
        MandalaBackgroundModeStore,
        MandalaBorderOpacityStore,
        MandalaGridCustomLayoutsStore,
        MandalaGridHighlightColorStore,
        MandalaGridHighlightWidthStore,
        MandalaFontSize3x3DesktopStore,
        MandalaFontSize3x3MobileStore,
        MandalaFontSize7x9DesktopStore,
        MandalaFontSize7x9MobileStore,
        MandalaFontSize9x9DesktopStore,
        MandalaFontSize9x9MobileStore,
        MandalaCellPreviewFontSizeDesktopStore,
        MandalaCellPreviewFontSizeMobileStore,
        MandalaFontSizeSidebarDesktopStore,
        MandalaFontSizeSidebarMobileStore,
        MandalaGridSelectedLayoutIdStore,
        MandalaSectionColorOpacityStore,
        ShowCellQuickPreviewDialogStore,
        ShowMandalaDetailSidebarStore,
        Show3x3SubgridNavButtonsStore,
        ShowDayPlanTodayButtonStore,
        Show9x9ParallelNavButtonsStore,
        ShowHiddenCardInfoStore,
        SquareLayoutStore,
        WeekPlanEnabledStore,
        WhiteThemeModeStore,
    } from 'src/mandala-settings/state/derived/view-settings-store';
    import { getDefaultTheme } from 'src/stores/view/subscriptions/effects/css-variables/helpers/get-default-theme';
    import {
        DEFAULT_CARDS_GAP,
        DEFAULT_INACTIVE_NODE_OPACITY,
        DEFAULT_H1_FONT_SIZE_EM,
        DEFAULT_MANDALA_CELL_PREVIEW_FONT_SIZE_DESKTOP,
        DEFAULT_MANDALA_CELL_PREVIEW_FONT_SIZE_MOBILE,
        DEFAULT_MANDALA_GRID_HIGHLIGHT_COLOR,
        DEFAULT_MANDALA_GRID_HIGHLIGHT_WIDTH,
    } from 'src/mandala-settings/state/default-settings';
    import ViewOptionsFontPanel from './components/view-options-font-panel.svelte';
    import ViewOptionsDisplayPanel from './components/view-options-display-panel.svelte';
    import ViewOptionsEditPanel from './components/view-options-edit-panel.svelte';
    import ViewOptionsCustomLayoutModal from './components/view-options-custom-layout-modal.svelte';
    import ViewOptionsTemplatePanel from './components/view-options-template-panel.svelte';
    import ExportModeModal, {
        type ExportMode,
    } from './components/export-mode-modal.svelte';
    import type { LastExportPreset } from 'src/mandala-settings/state/settings-type';
    import {
        closeExportModeModal,
        exportModeModalViewId,
        openExportModeModalForView,
    } from './export-mode-modal-store';
    import {
        createViewOptionsSettingsActions,
    } from './view-options-settings-actions';
    import {
        createViewOptionsExportActions,
    } from './view-options-export-actions';
    import {
        createViewOptionsExportModalState,
    } from './view-options-export-modal-state';
    import {
        createViewOptionsDocumentActions,
    } from './view-options-document-actions';
    import { openCurrentFileMandalaSettingsModal } from 'src/obsidian/modals/current-file-mandala-settings-modal';

    const dispatch = createEventDispatcher<{ close: void }>();
    const view = getView();
    const isMobile = Platform.isMobile;

    export let show = false;
    let showEditOptions = false;
    let showFontOptions = false;
    let showDisplayOptions = false;
    let showTemplateOptions = false;
    let mobileBoundsStyle = '';
    let listenersAttached = false;
    let previousShow = show;
    let isExportModeModalOpen = false;
    let exportModalInlineStyle: string | undefined = undefined;
    let isCustomLayoutModalOpen = false;

    const a4Mode = MandalaA4ModeStore(view);
    const a4Orientation = MandalaA4OrientationStore(view);
    const borderOpacity = MandalaBorderOpacityStore(view);
    const gridHighlightColorStore = MandalaGridHighlightColorStore(view);
    const gridHighlightWidth = MandalaGridHighlightWidthStore(view);
    const sectionColorOpacity = MandalaSectionColorOpacityStore(view);
    const backgroundMode = MandalaBackgroundModeStore(view);
    const whiteThemeMode = WhiteThemeModeStore(view);
    const squareLayout = SquareLayoutStore(view);
    const selectedLayoutId = MandalaGridSelectedLayoutIdStore(view);
    const customLayouts = MandalaGridCustomLayoutsStore(view);
    const show3x3SubgridNavButtons = Show3x3SubgridNavButtonsStore(view);
    const show9x9ParallelNavButtons = Show9x9ParallelNavButtonsStore(view);
    const showDayPlanTodayButton = ShowDayPlanTodayButtonStore(view);
    const showHiddenCardInfo = ShowHiddenCardInfoStore(view);
    const dayPlanEnabled = DayPlanEnabledStore(view);
    const weekPlanEnabled = WeekPlanEnabledStore(view);
    const contextMenuCopyLinkVisibility =
        ContextMenuCopyLinkVisibilityStore(view);
    const detailSidebarPreviewMode = DetailSidebarPreviewModeStore(view);
    const showMandalaDetailSidebar = ShowMandalaDetailSidebarStore(view);
    const exportModalState = createViewOptionsExportModalState({ isMobile });
    const exportModalPosition = exportModalState.position;
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
    const fontSize7x9 = isMobile
        ? MandalaFontSize7x9MobileStore(view)
        : MandalaFontSize7x9DesktopStore(view);
    const fontSizeSidebar = isMobile
        ? MandalaFontSizeSidebarMobileStore(view)
        : MandalaFontSizeSidebarDesktopStore(view);
    const fontSizeCellPreview = isMobile
        ? MandalaCellPreviewFontSizeMobileStore(view)
        : MandalaCellPreviewFontSizeDesktopStore(view);
    const showCellQuickPreviewDialog = ShowCellQuickPreviewDialogStore(view);
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
    const gridHighlightColor = derived(
        view.plugin.settings,
        (state) =>
            state.view.mandalaGridHighlightColor ??
            DEFAULT_MANDALA_GRID_HIGHLIGHT_COLOR,
    );
    const inactiveNodeOpacity = derived(
        view.plugin.settings,
        (state) => state.view.theme.inactiveNodeOpacity,
    );
    const templatesFilePathStore = derived(
        view.plugin.settings,
        (state) => state.general.mandalaTemplatesFilePath,
    );
    const lastExportPresetStore = derived(
        view.plugin.settings,
        (state) => state.view.lastExportPreset,
    );
    const settingsActions = createViewOptionsSettingsActions({
        view,
        isMobile,
        getContextMenuCopyLinkVisibility: () => $contextMenuCopyLinkVisibility,
        getA4Mode: () => $a4Mode,
        getShowMandalaDetailSidebar: () => $showMandalaDetailSidebar,
        getSquareLayout: () => $squareLayout,
        getSelectedLayoutId: () => $selectedLayoutId,
    });
    const {
        toggleWhiteTheme,
        toggleHiddenCardInfo,
        toggle9x9ParallelNavButtons,
        toggle3x3SubgridNavButtons,
        toggleDayPlanTodayButton,
        toggleCellQuickPreviewDialog,
        toggleCopyBlockPlain,
        toggleCopyBlockEmbed,
        toggleCopyHeadingPlain,
        toggleCopyHeadingEmbed,
        toggleCopyHeadingEmbedDollar,
        updateDetailSidebarPreviewMode,
        updateA4Mode,
        setA4Orientation,
        updateMandalaDetailSidebar,
        updateCardsGapValue,
        updateFontSize3x3Value,
        updateFontSize9x9Value,
        updateFontSize7x9Value,
        updateFontSizeSidebarValue,
        updateFontSizeCellPreviewValue,
        updateHeadingsFontSizeValue,
        updateBorderOpacityValue,
        updateSectionColorOpacityValue,
        updateGridHighlightWidthValue,
        updateInactiveNodeOpacityValue,
        updateContainerBgColor,
        updateActiveBranchBgColor,
        updateActiveBranchColorValue,
        updateGridHighlightColorValue,
        updateBackgroundMode,
        updateSquareLayout,
        selectGridLayout,
        createCustomGridLayout,
        updateCustomGridLayout,
        deleteCustomGridLayout,
    } = settingsActions;
    let clearEmptySubgrids = () => {};
    let openTemplatesFileFromPath = () => {};
    let pickTemplatesFile = () => {};
    let saveCurrentThemeAsTemplate = () => {};
    let applyTemplateToCurrentTheme = () => {};
    let openHotkeysModal = () => {};
    let exportCurrentFile: () => Promise<void> = async () => {};

    $: isExportModeModalOpen = $exportModeModalViewId === view.id;
    $: if (
        isExportModeModalOpen &&
        exportMode === 'pdf-a4' &&
        $showMandalaDetailSidebar
    ) {
        updateMandalaDetailSidebar(false);
    }

    type ExportMode = 'png-square' | 'png-screen' | 'pdf-a4';
    let exportMode: ExportMode = 'png-screen';
    let includeSidebarInPngScreen = true;
    let exportModeLabel = 'PNG（屏幕范围）';
    let exportModeHint = '包含侧边栏';
    let appearanceStyleLabel = '风格：沉浸';
    let appearanceShapeLabel = '形状：自适应';
    let appearanceBackgroundLabel = '背景：无背景';
    let appearanceOrientationLabel = '方位：从左到右';

    const setExportMode = (mode: ExportMode) => {
        exportMode = mode;

        if (mode === 'pdf-a4') {
            updateA4Mode(true);
            return;
        }

        updateA4Mode(false);
    };

    const toggleIncludeSidebarInPngScreen = () => {
        includeSidebarInPngScreen = !includeSidebarInPngScreen;
        updateMandalaDetailSidebar(includeSidebarInPngScreen);
    };

    $: exportModeLabel =
        exportMode === 'png-square'
            ? 'PNG（格子范围）'
            : exportMode === 'pdf-a4'
              ? 'PDF（A4）'
              : 'PNG（屏幕范围）';
    $: exportModeHint =
        exportMode === 'png-screen'
            ? includeSidebarInPngScreen
                ? '包含侧边栏'
                : '不含侧边栏'
            : exportMode === 'pdf-a4'
              ? $a4Orientation === 'landscape'
                  ? '横向'
                  : '纵向'
              : $squareLayout
                ? '正方形留白'
                : '自适应长方形';
    $: exportActionLabel = exportMode === 'pdf-a4' ? '导出 PDF' : '导出 PNG';
    $: appearanceStyleLabel = $whiteThemeMode ? '风格：全景' : '风格：沉浸';
    $: appearanceShapeLabel = $squareLayout ? '形状：正方形' : '形状：自适应';
    $: appearanceBackgroundLabel =
        $backgroundMode === 'custom'
            ? '背景：色块'
            : $backgroundMode === 'gray'
              ? '背景：灰色间隔'
              : '背景：无背景';
    $: appearanceOrientationLabel = (() => {
        if ($selectedLayoutId === 'builtin:south-start') {
            return '方位：从南开始';
        }
        if ($selectedLayoutId === 'builtin:left-to-right') {
            return '方位：从左到右';
        }
        const selectedCustomLayout =
            $customLayouts.find((layout) => layout.id === $selectedLayoutId) ??
            null;
        return selectedCustomLayout
            ? `方位：自定义 / ${selectedCustomLayout.name}`
            : '方位：从左到右';
    })();
    $: if (
        isExportModeModalOpen &&
        exportMode === 'png-screen' &&
        includeSidebarInPngScreen !== $showMandalaDetailSidebar
    ) {
        includeSidebarInPngScreen = $showMandalaDetailSidebar;
    }

    let showImmersiveOptions = false;
    let showPanoramaOptions = false;
    let showExportStyleDetails = false;
    let showExportFontDetails = false;

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

    const _updateA4Orientation = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) return;
        const orientation =
            target.value === 'landscape' ? 'landscape' : 'portrait';
        setA4Orientation(orientation);
    };
    const roundToDecimal = (value: number, decimalPlaces: number) =>
        Math.round(value * Math.pow(10, decimalPlaces)) /
        Math.pow(10, decimalPlaces);

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

    const updateGridHighlightWidth = createNumericInputHandler(
        updateGridHighlightWidthValue,
    );

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
    const updateFontSize7x9 = createNumericInputHandler(updateFontSize7x9Value);
    const updateFontSizeSidebar = createNumericInputHandler(
        updateFontSizeSidebarValue,
    );
    const updateFontSizeCellPreview = createNumericInputHandler(
        updateFontSizeCellPreviewValue,
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

    const stepGridHighlightWidth = createStepHandler(
        updateGridHighlightWidthValue,
    );

    const stepInactiveOpacity = (current: number, delta: number) => {
        updateInactiveNodeOpacityValue(current + delta);
    };

    const stepCardsGap = (current: number, delta: number) => {
        updateCardsGapValue(current + delta);
    };

    const stepFontSize3x3 = createStepHandler(updateFontSize3x3Value);
    const stepFontSize9x9 = createStepHandler(updateFontSize9x9Value);
    const stepFontSize7x9 = createStepHandler(updateFontSize7x9Value);
    const stepFontSizeSidebar = createStepHandler(updateFontSizeSidebarValue);
    const stepFontSizeCellPreview = createStepHandler(
        updateFontSizeCellPreviewValue,
    );
    const stepHeadingsFontSize = createStepHandler(
        updateHeadingsFontSizeValue,
        1,
    );

    const updateContainerBg = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateContainerBgColor(target.value);
    };

    const resetContainerBg = () => {
        updateContainerBgColor(undefined);
    };

    const updateActiveBranchBg = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateActiveBranchBgColor(target.value);
    };

    const resetActiveBranchBg = () => {
        updateActiveBranchBgColor(undefined);
    };

    const updateActiveBranchColor = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateActiveBranchColorValue(target.value);
    };

    const resetActiveBranchColor = () => {
        updateActiveBranchColorValue(undefined);
    };

    const updateGridHighlightColor = (event: Event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        updateGridHighlightColorValue(target.value);
    };

    const resetGridHighlightColor = () => {
        updateGridHighlightColorValue(undefined);
    };

    const resetInactiveNodeOpacity = () => {
        updateInactiveNodeOpacityValue(DEFAULT_INACTIVE_NODE_OPACITY);
    };

    const resetCardsGap = () => {
        updateCardsGapValue(DEFAULT_CARDS_GAP);
    };

    const resetGridHighlightWidth = () => {
        updateGridHighlightWidthValue(DEFAULT_MANDALA_GRID_HIGHLIGHT_WIDTH);
    };

    const resetFontSize3x3 = () => {
        updateFontSize3x3Value(16);
    };

    const resetFontSize9x9 = () => {
        updateFontSize9x9Value(11);
    };

    const resetFontSize7x9 = () => {
        updateFontSize7x9Value(isMobile ? 10 : 11);
    };

    const resetFontSizeSidebar = () => {
        updateFontSizeSidebarValue(16);
    };

    const resetFontSizeCellPreview = () => {
        updateFontSizeCellPreviewValue(
            isMobile
                ? DEFAULT_MANDALA_CELL_PREVIEW_FONT_SIZE_MOBILE
                : DEFAULT_MANDALA_CELL_PREVIEW_FONT_SIZE_DESKTOP,
        );
    };

    const resetHeadingsFontSize = () => {
        updateHeadingsFontSizeValue(DEFAULT_H1_FONT_SIZE_EM);
    };
    type PrintConfig = {
        exportMode: ExportMode;
        includeSidebarInPngScreen: boolean;
        a4Orientation: 'portrait' | 'landscape';
        backgroundMode: 'none' | 'custom' | 'gray';
        sectionColorOpacity: number;
        borderOpacity: number;
        gridHighlightColor?: string;
        gridHighlightWidth: number;
        whiteThemeMode: boolean;
        squareLayout: boolean;
        showMandalaDetailSidebar: boolean;
        fontSize3x3: number;
        fontSize9x9: number;
        fontSize7x9: number;
        fontSizeSidebar: number;
        headingsFontSizeEm: number;
    };

    let exportSessionSnapshot: PrintConfig | null = null;
    let isInExportSession = false;
    let exportEditPanelProps: Record<string, unknown> = {};
    let exportFontPanelProps: Record<string, unknown> = {};

    const capturePrintConfig = (): PrintConfig => {
        return {
            exportMode,
            includeSidebarInPngScreen,
            a4Orientation: $a4Orientation,
            backgroundMode: $backgroundMode,
            sectionColorOpacity: $sectionColorOpacity,
            borderOpacity: $borderOpacity,
            gridHighlightColor: $gridHighlightColorStore,
            gridHighlightWidth: $gridHighlightWidth,
            whiteThemeMode: $whiteThemeMode,
            squareLayout: $squareLayout,
            showMandalaDetailSidebar: $showMandalaDetailSidebar,
            fontSize3x3: $fontSize3x3,
            fontSize9x9: $fontSize9x9,
            fontSize7x9: $fontSize7x9,
            fontSizeSidebar: $fontSizeSidebar,
            headingsFontSizeEm: $headingsFontSizeEm,
        };
    };

    const applyPrintConfig = (config: PrintConfig) => {
        setExportMode(config.exportMode);
        includeSidebarInPngScreen = config.includeSidebarInPngScreen;
        updateWhiteThemeMode(config.whiteThemeMode);
        updateBackgroundMode(config.backgroundMode);
        updateSectionColorOpacityValue(config.sectionColorOpacity);
        updateBorderOpacityValue(config.borderOpacity);
        if (config.gridHighlightColor) {
            view.plugin.settings.dispatch({
                type: 'settings/view/mandala/set-grid-highlight-color',
                payload: { color: config.gridHighlightColor },
            });
        } else {
            resetGridHighlightColor();
        }
        updateGridHighlightWidthValue(config.gridHighlightWidth);
        updateSquareLayout(config.squareLayout);
        updateMandalaDetailSidebar(config.showMandalaDetailSidebar);
        updateFontSize3x3Value(config.fontSize3x3);
        updateFontSize9x9Value(config.fontSize9x9);
        updateFontSize7x9Value(config.fontSize7x9);
        updateFontSizeSidebarValue(config.fontSizeSidebar);
        updateHeadingsFontSizeValue(config.headingsFontSizeEm);
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-a4-orientation',
            payload: { orientation: config.a4Orientation },
        });
    };

    const enterExportSession = () => {
        if (isInExportSession) return;
        includeSidebarInPngScreen = $showMandalaDetailSidebar;
        exportSessionSnapshot = capturePrintConfig();
        isInExportSession = true;
    };

    const exitExportSession = () => {
        if (!isInExportSession) return;
        if (exportSessionSnapshot) {
            applyPrintConfig(exportSessionSnapshot);
        }
        exportSessionSnapshot = null;
        isInExportSession = false;
    };

    const applyLastExportPreset = () => {
        const preset = $lastExportPresetStore;
        if (!preset) {
            new Notice('暂无上一次导出设置。');
            return;
        }
        applyPrintConfig({
            exportMode: preset.exportMode,
            includeSidebarInPngScreen: preset.includeSidebar,
            a4Orientation: preset.a4Orientation,
            backgroundMode: preset.backgroundMode,
            sectionColorOpacity: preset.sectionColorOpacity,
            borderOpacity: preset.borderOpacity,
            gridHighlightColor: preset.gridHighlightColor,
            gridHighlightWidth:
                preset.gridHighlightWidth ??
                DEFAULT_MANDALA_GRID_HIGHLIGHT_WIDTH,
            whiteThemeMode: preset.whiteThemeMode,
            squareLayout: preset.squareLayout,
            fontSize3x3: preset.fontSize3x3 ?? $fontSize3x3,
            fontSize9x9: preset.fontSize9x9 ?? $fontSize9x9,
            fontSize7x9: preset.fontSize7x9 ?? $fontSize7x9,
            fontSizeSidebar: preset.fontSizeSidebar ?? $fontSizeSidebar,
            headingsFontSizeEm:
                preset.headingsFontSizeEm ?? $headingsFontSizeEm,
            showMandalaDetailSidebar:
                preset.exportMode === 'png-screen'
                    ? preset.includeSidebar
                    : $showMandalaDetailSidebar,
        });
    };

    const createCurrentExportPreset = (): LastExportPreset => {
        return {
            exportMode,
            includeSidebar: includeSidebarInPngScreen,
            a4Orientation: $a4Orientation,
            backgroundMode: $backgroundMode,
            sectionColorOpacity: $sectionColorOpacity,
            borderOpacity: $borderOpacity,
            gridHighlightColor: $gridHighlightColorStore,
            gridHighlightWidth: $gridHighlightWidth,
            whiteThemeMode: $whiteThemeMode,
            squareLayout: $squareLayout,
            fontSize3x3: $fontSize3x3,
            fontSize9x9: $fontSize9x9,
            fontSize7x9: $fontSize7x9,
            fontSizeSidebar: $fontSizeSidebar,
            headingsFontSizeEm: $headingsFontSizeEm,
        };
    };

    const persistLastExportPreset = (preset?: LastExportPreset) => {
        const nextPreset = preset ?? createCurrentExportPreset();
        view.plugin.settings.dispatch({
            type: 'settings/view/mandala/set-last-export-preset',
            payload: { preset: nextPreset },
        });
    };

    $: ({ exportCurrentFile } = createViewOptionsExportActions({
        view,
        isMobile,
        getExportMode: () => exportMode,
        getIncludeSidebarInPngScreen: () => includeSidebarInPngScreen,
        getWhiteThemeMode: () => $whiteThemeMode,
        getSquareLayout: () => $squareLayout,
        getBorderOpacity: () => $borderOpacity,
        getGridHighlightWidth: () => $gridHighlightWidth,
        getGridHighlightColor: () => $gridHighlightColorStore,
        getA4Mode: () => $a4Mode,
        getA4Orientation: () => $a4Orientation,
        createCurrentExportPreset,
        persistLastExportPreset,
        closeExportMode,
    }));

    const openCustomLayoutModal = () => {
        isCustomLayoutModalOpen = true;
    };

    const closeCustomLayoutModal = () => {
        isCustomLayoutModalOpen = false;
    };

    $: if ($a4Mode && exportMode !== 'pdf-a4') {
        exportMode = 'pdf-a4';
    }

    $: if (!$a4Mode && exportMode === 'pdf-a4') {
        exportMode = 'png-screen';
    }

    $: if (!show && isInExportSession && !isExportModeModalOpen) {
        exitExportSession();
    }

    $: if (isExportModeModalOpen && !isInExportSession) {
        enterExportSession();
    }

    const closeMenu = (preserveExportModeSession = false) => {
        if (!preserveExportModeSession) {
            exitExportSession();
        }
        dispatch('close');
        showEditOptions = false;
        showFontOptions = false;
        showDisplayOptions = false;
        showTemplateOptions = false;
        showImmersiveOptions = false;
        showPanoramaOptions = false;
        isCustomLayoutModalOpen = false;
    };

    $: ({
        clearEmptySubgrids,
        openTemplatesFileFromPath,
        pickTemplatesFile,
        saveCurrentThemeAsTemplate,
        applyTemplateToCurrentTheme,
        openHotkeysModal,
    } = createViewOptionsDocumentActions({
        view,
        getTemplatesFilePath: () => $templatesFilePathStore,
        closeMenu: () => closeMenu(),
    }));

    const openExportModeModal = () => {
        enterExportSession();
        exportModalState.open();
        openExportModeModalForView(view.id);
        closeMenu(true);
    };

    const openCurrentFileSettings = () => {
        if (!view.file) {
            new Notice('未找到当前文件。');
            return;
        }
        openCurrentFileMandalaSettingsModal(view);
        closeMenu();
    };

    const closeExportMode = () => {
        exportModalState.close();
        closeExportModeModal();
        exitExportSession();
    };

    $: exportModalInlineStyle =
        exportModalState.toInlineStyle($exportModalPosition);
    $: exportEditPanelProps = {
        show: true,
        showTrigger: false,
        whiteThemeMode: $whiteThemeMode,
        showImmersiveOptions,
        showPanoramaOptions,
        containerBg: $containerBg,
        activeBranchBg: $activeBranchBg,
        activeBranchColor: $activeBranchColor,
        inactiveNodeOpacity: $inactiveNodeOpacity,
        borderOpacity: $borderOpacity,
        backgroundMode: $backgroundMode,
        sectionColorOpacity: $sectionColorOpacity,
        squareLayout: $squareLayout,
        cardsGap: $cardsGap,
        selectedLayoutId: $selectedLayoutId,
        customLayouts: $customLayouts,
        toggle: () => undefined,
        updateWhiteThemeMode,
        toggleImmersiveOptions,
        togglePanoramaOptions,
        updateContainerBg,
        resetContainerBg,
        updateActiveBranchBg,
        resetActiveBranchBg,
        updateActiveBranchColor,
        resetActiveBranchColor,
        stepInactiveOpacity,
        updateInactiveNodeOpacity,
        resetInactiveNodeOpacity,
        stepBorderOpacity,
        updateBorderOpacity,
        updateBackgroundMode,
        stepOpacity,
        updateSectionColorOpacity,
        updateSquareLayout,
        stepCardsGap,
        updateCardsGap,
        resetCardsGap,
        selectGridLayout,
        openCustomLayoutModal,
    };
    $: exportFontPanelProps = {
        isMobile,
        show: true,
        showTrigger: false,
        panelTitle: `导出字体设置（${isMobile ? '手机端' : 'PC端'}）`,
        panelDescription:
            '仅本次导出会话生效，可分别调整 3x3、9x9、nx9、右侧详情栏与标题字号',
        gridSectionTitle: `格子字体大小（导出 / ${isMobile ? '手机端' : 'PC端'}）`,
        headingsSectionTitle:
            '标题字体大小（导出，em，可理解为正文字体的放大倍数）',
        fontSize3x3: $fontSize3x3,
        fontSize9x9: $fontSize9x9,
        fontSize7x9: $fontSize7x9,
        fontSizeSidebar: $fontSizeSidebar,
        fontSizeCellPreview: $fontSizeCellPreview,
        headingsFontSizeEm: $headingsFontSizeEm,
        weekPlanEnabled: $weekPlanEnabled,
        showCellQuickPreviewDialog: false,
        toggle: () => undefined,
        stepFontSize3x3,
        updateFontSize3x3,
        resetFontSize3x3,
        stepFontSize9x9,
        updateFontSize9x9,
        resetFontSize9x9,
        stepFontSize7x9,
        updateFontSize7x9,
        resetFontSize7x9,
        stepFontSizeSidebar,
        updateFontSizeSidebar,
        resetFontSizeSidebar,
        stepFontSizeCellPreview,
        updateFontSizeCellPreview,
        resetFontSizeCellPreview,
        stepHeadingsFontSize,
        updateHeadingsFontSize,
        resetHeadingsFontSize,
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
        let width = Math.max(
            260,
            visibleViewport.right - visibleViewport.left - padding * 2,
        );
        let height = Math.max(
            220,
            visibleViewport.bottom - visibleViewport.top - padding * 2,
        );

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

    // 点击外部关闭菜单。自定义布局弹窗通过 Portal 渲染，
    // 这里需要把弹窗本体和遮罩层都视为“菜单内部”，避免点击时误关菜单。
    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.closest('.custom-layout-modal') ||
            target.closest('.custom-layout-modal__overlay')
        ) {
            return;
        }
        if (
            !target.closest('.view-options-menu') &&
            !target.closest('.js-view-options-trigger')
        ) {
            closeMenu();
        }
    };

    const attachListeners = () => {
        if (listenersAttached) return;
        listenersAttached = true;
        document.addEventListener('click', handleClickOutside);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('orientationchange', handleViewportChange);
        window.visualViewport?.addEventListener('resize', handleViewportChange);
        window.visualViewport?.addEventListener('scroll', handleViewportChange);
        document.addEventListener('focusin', handleViewportChange, true);
        handleViewportChange();
    };

    const detachListeners = () => {
        if (!listenersAttached) return;
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
    };

    onMount(() => {
        if (show) {
            setTimeout(() => {
                if (show) {
                    attachListeners();
                }
            }, 0);
        }
    });

    afterUpdate(() => {
        if (show === previousShow) return;
        previousShow = show;

        if (show) {
            setTimeout(() => {
                if (show) {
                    attachListeners();
                }
            }, 0);
            return;
        }

        detachListeners();
    });

    onDestroy(() => {
        detachListeners();
        if ($exportModeModalViewId === view.id) {
            closeExportModeModal();
        }
    });
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
                gridHighlightColor={$gridHighlightColor}
                gridHighlightWidth={$gridHighlightWidth}
                backgroundMode={$backgroundMode}
                sectionColorOpacity={$sectionColorOpacity}
                squareLayout={$squareLayout}
                cardsGap={$cardsGap}
                selectedLayoutId={$selectedLayoutId}
                customLayouts={$customLayouts}
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
                {updateGridHighlightColor}
                {resetGridHighlightColor}
                {stepGridHighlightWidth}
                {updateGridHighlightWidth}
                {resetGridHighlightWidth}
                {updateBackgroundMode}
                {stepOpacity}
                {updateSectionColorOpacity}
                {updateSquareLayout}
                {stepCardsGap}
                {updateCardsGap}
                {resetCardsGap}
                {selectGridLayout}
                {openCustomLayoutModal}
            />

            <ViewOptionsDisplayPanel
                show={showDisplayOptions}
                showHiddenCardInfo={$showHiddenCardInfo}
                show3x3SubgridNavButtons={$show3x3SubgridNavButtons}
                show9x9ParallelNavButtons={$show9x9ParallelNavButtons}
                dayPlanEnabled={$dayPlanEnabled}
                showDayPlanTodayButton={$showDayPlanTodayButton}
                showCellQuickPreviewDialog={$showCellQuickPreviewDialog}
                showCopyBlockPlain={$contextMenuCopyLinkVisibility[
                    'block-plain'
                ]}
                showCopyBlockEmbed={$contextMenuCopyLinkVisibility[
                    'block-embed'
                ]}
                showCopyHeadingPlain={$contextMenuCopyLinkVisibility[
                    'heading-plain'
                ]}
                showCopyHeadingEmbed={$contextMenuCopyLinkVisibility[
                    'heading-embed'
                ]}
                showCopyHeadingEmbedDollar={$contextMenuCopyLinkVisibility[
                    'heading-embed-dollar'
                ]}
                detailSidebarPreviewMode={$detailSidebarPreviewMode}
                toggle={() => (showDisplayOptions = !showDisplayOptions)}
                {toggleHiddenCardInfo}
                {toggle3x3SubgridNavButtons}
                {toggle9x9ParallelNavButtons}
                {toggleDayPlanTodayButton}
                {toggleCellQuickPreviewDialog}
                {toggleCopyBlockPlain}
                {toggleCopyBlockEmbed}
                {toggleCopyHeadingPlain}
                {toggleCopyHeadingEmbed}
                {toggleCopyHeadingEmbedDollar}
                {updateDetailSidebarPreviewMode}
            />

            <ViewOptionsFontPanel
                {isMobile}
                show={showFontOptions}
                fontSize3x3={$fontSize3x3}
                fontSize9x9={$fontSize9x9}
                fontSize7x9={$fontSize7x9}
                fontSizeSidebar={$fontSizeSidebar}
                fontSizeCellPreview={$fontSizeCellPreview}
                weekPlanEnabled={$weekPlanEnabled}
                showCellQuickPreviewDialog={$showCellQuickPreviewDialog}
                headingsFontSizeEm={$headingsFontSizeEm}
                toggle={() => (showFontOptions = !showFontOptions)}
                {stepFontSize3x3}
                {updateFontSize3x3}
                {resetFontSize3x3}
                {stepFontSize9x9}
                {updateFontSize9x9}
                {resetFontSize9x9}
                {stepFontSize7x9}
                {updateFontSize7x9}
                {resetFontSize7x9}
                {stepFontSizeSidebar}
                {updateFontSizeSidebar}
                {resetFontSizeSidebar}
                {stepFontSizeCellPreview}
                {updateFontSizeCellPreview}
                {resetFontSizeCellPreview}
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
                    <div class="view-options-menu__desc">
                        打开快捷键设置面板
                    </div>
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

            <button
                class="view-options-menu__item"
                on:click={openCurrentFileSettings}
            >
                <div class="view-options-menu__icon">
                    <Settings2 class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">当前文件设置</div>
                    <div class="view-options-menu__desc">
                        打开九宫格当前文件设置面板
                    </div>
                </div>
            </button>

            <button
                class="view-options-menu__item"
                on:click={openExportModeModal}
            >
                <div class="view-options-menu__icon">
                    <Printer class="view-options-menu__icon-svg" size={18} />
                </div>
                <div class="view-options-menu__content">
                    <div class="view-options-menu__label">导出模式</div>
                    <div class="view-options-menu__desc">
                        打开独立导出面板（临时会话）
                    </div>
                </div>
            </button>

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

<svelte:window
    on:keydown={(event) =>
        exportModalState.handleEscape(
            event,
            isExportModeModalOpen,
            closeExportMode,
        )}
    on:mousemove={(event) =>
        exportModalState.moveDrag(event, isExportModeModalOpen)}
    on:mouseup={() => exportModalState.stopDrag()}
    on:touchmove|nonpassive={(event) =>
        exportModalState.moveDrag(event, isExportModeModalOpen)}
    on:touchend={() => exportModalState.stopDrag()}
/>

    <ExportModeModal
        open={isExportModeModalOpen}
        {isMobile}
    inlineStyle={exportModalInlineStyle}
    {exportMode}
    {exportModeLabel}
    {exportModeHint}
    {appearanceStyleLabel}
    {appearanceShapeLabel}
    {appearanceBackgroundLabel}
    {appearanceOrientationLabel}
    {includeSidebarInPngScreen}
        a4Orientation={$a4Orientation}
        {showExportStyleDetails}
        {showExportFontDetails}
        squareLayout={$squareLayout}
        editPanelProps={exportEditPanelProps}
        fontPanelProps={exportFontPanelProps}
        canApplyLastExportPreset={Boolean($lastExportPresetStore)}
        {exportActionLabel}
    onClose={closeExportMode}
    onStartDrag={(event) =>
        exportModalState.startDrag(event, isExportModeModalOpen)}
    onSetExportMode={setExportMode}
    onToggleIncludeSidebar={toggleIncludeSidebarInPngScreen}
    onUpdateA4Orientation={_updateA4Orientation}
    onToggleStyleDetails={() =>
        (showExportStyleDetails = !showExportStyleDetails)}
    onToggleFontDetails={() =>
        (showExportFontDetails = !showExportFontDetails)}
    onApplyLastExportPreset={applyLastExportPreset}
    onExportCurrentFile={exportCurrentFile}
/>

<ViewOptionsCustomLayoutModal
    open={isCustomLayoutModalOpen}
    {isMobile}
    activeLayoutId={$selectedLayoutId}
    customLayouts={$customLayouts}
    onClose={closeCustomLayoutModal}
    onSelectLayout={selectGridLayout}
    onCreateCustomLayout={createCustomGridLayout}
    onUpdateCustomLayout={updateCustomGridLayout}
    onDeleteCustomLayout={deleteCustomGridLayout}
/>
