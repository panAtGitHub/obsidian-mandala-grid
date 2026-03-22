import type {
    ContextMenuCopyLinkVariant,
    ContextMenuCopyLinkVisibility,
    DetailSidebarPreviewMode,
    MandalaCustomLayout,
} from 'src/mandala-settings/state/settings-type';
import type { SettingsActions } from 'src/mandala-settings/state/settings-store-actions';
import type { MandalaView } from 'src/view/view';

export const clampGap = (value: number) => Math.min(20, Math.max(0, value));
export const clampOpacity = (value: number) =>
    Math.min(100, Math.max(0, value));
export const clampGridHighlightWidth = (value: number) =>
    Math.min(8, Math.max(1, value));
export const clampFontSize = (value: number) =>
    Math.min(36, Math.max(6, value));
export const clampH1FontSize = (value: number) =>
    Math.min(4, Math.max(1, value));

type CreateViewOptionsSettingsActionsArgs = {
    view: MandalaView;
    isMobile: boolean;
    getContextMenuCopyLinkVisibility: () => ContextMenuCopyLinkVisibility;
    getA4Mode: () => boolean;
    getShowMandalaDetailSidebar: () => boolean;
    getSquareLayout: () => boolean;
    getSelectedLayoutId: () => string;
};

export const createViewOptionsSettingsActions = ({
    view,
    isMobile,
    getContextMenuCopyLinkVisibility,
    getA4Mode,
    getShowMandalaDetailSidebar,
    getSquareLayout,
    getSelectedLayoutId,
}: CreateViewOptionsSettingsActionsArgs) => {
    const settingsStore = view.plugin.settings as {
        dispatch: (action: SettingsActions) => void;
    };
    const dispatch = (action: SettingsActions) => settingsStore.dispatch(action);

    const setContextMenuCopyLinkVisibility = (
        variant: ContextMenuCopyLinkVariant,
        visible: boolean,
    ) => {
        dispatch({
            type: 'settings/view/context-menu-copy-link/set-visibility',
            payload: { variant, visible },
        });
    };

    const createCopyLinkVisibilityToggle = (
        variant: ContextMenuCopyLinkVariant,
    ) => {
        return () => {
            const visibility = getContextMenuCopyLinkVisibility();
            setContextMenuCopyLinkVisibility(variant, !visibility[variant]);
        };
    };

    const createPlatformFontSizeUpdater = (
        desktopType:
            | 'settings/view/font-size/set-3x3-desktop'
            | 'settings/view/font-size/set-9x9-desktop'
            | 'settings/view/font-size/set-7x9-desktop'
            | 'settings/view/font-size/set-sidebar-desktop'
            | 'settings/view/font-size/set-cell-preview-desktop',
        mobileType:
            | 'settings/view/font-size/set-3x3-mobile'
            | 'settings/view/font-size/set-9x9-mobile'
            | 'settings/view/font-size/set-7x9-mobile'
            | 'settings/view/font-size/set-sidebar-mobile'
            | 'settings/view/font-size/set-cell-preview-mobile',
    ) => {
        return (value: number) => {
            dispatch({
                type: isMobile ? mobileType : desktopType,
                payload: { fontSize: clampFontSize(value) },
            });
        };
    };

    return {
        toggleWhiteTheme() {
            dispatch({
                type: 'settings/view/toggle-white-theme',
            });
        },
        toggleHiddenCardInfo() {
            dispatch({
                type: 'settings/view/toggle-hidden-card-info',
            });
        },
        toggle9x9ParallelNavButtons() {
            dispatch({
                type: isMobile
                    ? 'settings/view/toggle-9x9-parallel-nav-buttons-mobile'
                    : 'settings/view/toggle-9x9-parallel-nav-buttons-desktop',
            });
        },
        toggle3x3SubgridNavButtons() {
            dispatch({
                type: isMobile
                    ? 'settings/view/toggle-3x3-subgrid-nav-buttons-mobile'
                    : 'settings/view/toggle-3x3-subgrid-nav-buttons-desktop',
            });
        },
        toggleDayPlanTodayButton() {
            dispatch({
                type: isMobile
                    ? 'settings/view/toggle-day-plan-today-button-mobile'
                    : 'settings/view/toggle-day-plan-today-button-desktop',
            });
        },
        toggleCellQuickPreviewDialog() {
            dispatch({
                type: isMobile
                    ? 'settings/view/toggle-cell-quick-preview-dialog-mobile'
                    : 'settings/view/toggle-cell-quick-preview-dialog-desktop',
            });
        },
        toggleCopyBlockPlain: createCopyLinkVisibilityToggle('block-plain'),
        toggleCopyBlockEmbed: createCopyLinkVisibilityToggle('block-embed'),
        toggleCopyHeadingPlain: createCopyLinkVisibilityToggle('heading-plain'),
        toggleCopyHeadingEmbed: createCopyLinkVisibilityToggle('heading-embed'),
        toggleCopyHeadingEmbedDollar:
            createCopyLinkVisibilityToggle('heading-embed-dollar'),
        updateDetailSidebarPreviewMode(mode: DetailSidebarPreviewMode) {
            dispatch({
                type: 'settings/view/detail-sidebar/set-preview-mode',
                payload: { mode },
            });
        },
        toggleA4Mode() {
            dispatch({
                type: 'settings/view/mandala/toggle-a4-mode',
            });
        },
        updateA4Mode(enabled: boolean) {
            if (enabled !== getA4Mode()) {
                dispatch({
                    type: 'settings/view/mandala/toggle-a4-mode',
                });
            }
        },
        setA4Orientation(orientation: 'portrait' | 'landscape') {
            dispatch({
                type: 'settings/view/mandala/set-a4-orientation',
                payload: { orientation },
            });
        },
        updateMandalaDetailSidebar(enabled: boolean) {
            if (enabled !== getShowMandalaDetailSidebar()) {
                view.toggleCurrentMandalaDetailSidebar();
            }
        },
        updateCardsGapValue(value: number) {
            dispatch({
                type: 'settings/view/layout/set-cards-gap',
                payload: { gap: clampGap(value) },
            });
        },
        updateFontSize3x3Value: createPlatformFontSizeUpdater(
            'settings/view/font-size/set-3x3-desktop',
            'settings/view/font-size/set-3x3-mobile',
        ),
        updateFontSize9x9Value: createPlatformFontSizeUpdater(
            'settings/view/font-size/set-9x9-desktop',
            'settings/view/font-size/set-9x9-mobile',
        ),
        updateFontSize7x9Value: createPlatformFontSizeUpdater(
            'settings/view/font-size/set-7x9-desktop',
            'settings/view/font-size/set-7x9-mobile',
        ),
        updateFontSizeSidebarValue: createPlatformFontSizeUpdater(
            'settings/view/font-size/set-sidebar-desktop',
            'settings/view/font-size/set-sidebar-mobile',
        ),
        updateFontSizeCellPreviewValue: createPlatformFontSizeUpdater(
            'settings/view/font-size/set-cell-preview-desktop',
            'settings/view/font-size/set-cell-preview-mobile',
        ),
        updateHeadingsFontSizeValue(value: number) {
            dispatch({
                type: 'settings/view/theme/set-h1-font-size',
                payload: { fontSize_em: clampH1FontSize(value) },
            });
        },
        updateBorderOpacityValue(value: number) {
            dispatch({
                type: 'settings/view/mandala/set-border-opacity',
                payload: { opacity: clampOpacity(value) },
            });
        },
        updateSectionColorOpacityValue(value: number) {
            dispatch({
                type: 'settings/view/mandala/set-section-color-opacity',
                payload: { opacity: clampOpacity(value) },
            });
        },
        updateGridHighlightWidthValue(value: number) {
            dispatch({
                type: 'settings/view/mandala/set-grid-highlight-width',
                payload: { width: clampGridHighlightWidth(value) },
            });
        },
        updateInactiveNodeOpacityValue(value: number) {
            dispatch({
                type: 'settings/view/theme/set-inactive-node-opacity',
                payload: { opacity: clampOpacity(value) },
            });
        },
        updateContainerBgColor(backgroundColor: string | undefined) {
            dispatch({
                type: 'settings/view/theme/set-container-bg-color',
                payload: { backgroundColor },
            });
        },
        updateActiveBranchBgColor(backgroundColor: string | undefined) {
            dispatch({
                type: 'settings/view/theme/set-active-branch-bg-color',
                payload: { backgroundColor },
            });
        },
        updateActiveBranchColorValue(color: string | undefined) {
            dispatch({
                type: 'settings/view/theme/set-active-branch-color',
                payload: { color },
            });
        },
        updateGridHighlightColorValue(color: string | undefined) {
            dispatch({
                type: 'settings/view/mandala/set-grid-highlight-color',
                payload: { color },
            });
        },
        updateBackgroundMode(mode: 'none' | 'custom' | 'gray') {
            dispatch({
                type: 'settings/view/mandala/set-background-mode',
                payload: { mode },
            });
        },
        updateSquareLayout(enabled: boolean) {
            if (enabled !== getSquareLayout()) {
                dispatch({
                    type: 'settings/view/toggle-square-layout',
                });
            }
        },
        selectGridLayout(layoutId: string) {
            if (layoutId === getSelectedLayoutId()) return;
            dispatch({
                type: 'settings/view/mandala/select-grid-layout',
                payload: { layoutId },
            });
            view.persistCurrentMandalaLayout(layoutId);
        },
        createCustomGridLayout(layout: MandalaCustomLayout) {
            dispatch({
                type: 'settings/view/mandala/create-custom-grid-layout',
                payload: { layout },
            });
        },
        updateCustomGridLayout(id: string, name: string, pattern: string) {
            dispatch({
                type: 'settings/view/mandala/update-custom-grid-layout',
                payload: { id, name, pattern },
            });
        },
        deleteCustomGridLayout(id: string) {
            dispatch({
                type: 'settings/view/mandala/delete-custom-grid-layout',
                payload: { id },
            });
        },
    };
};
