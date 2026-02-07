import { MandalaView } from 'src/view/view';
import { derived } from 'src/lib/store/derived';
import MandalaGrid from 'src/main';
import { Platform } from 'obsidian';

export const ViewSettingsStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view);

export const MandalaFontSize3x3DesktopStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaFontSize3x3Desktop,
    );

export const MandalaFontSize3x3MobileStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaFontSize3x3Mobile,
    );

export const MandalaFontSize9x9DesktopStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaFontSize9x9Desktop,
    );

export const MandalaFontSize9x9MobileStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaFontSize9x9Mobile,
    );

export const MandalaFontSizeSidebarDesktopStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaFontSizeSidebarDesktop,
    );

export const MandalaFontSizeSidebarMobileStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaFontSizeSidebarMobile,
    );

export const ShowLeftSidebarStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.showLeftSidebar);

export const LeftSidebarWidthStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.leftSidebarWidth);

export const LeftSidebarActiveTabStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.leftSidebarActiveTab);

export const ApplyGapBetweenCardsStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.applyGapBetweenCards);

export const OutlineModeStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.outlineMode);

export const MandalaModeStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.mandalaMode);

export const MandalaGridOrientationStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.mandalaGridOrientation);

export const MandalaA4ModeStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.mandalaA4Mode);

export const MandalaA4OrientationStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.mandalaA4Orientation);

export const MandalaBackgroundModeStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.mandalaBackgroundMode);

export const MaintainEditMode = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.maintainEditMode);

export const AlwaysShowCardButtons = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.alwaysShowCardButtons);

export const ShowHiddenCardInfoStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.showHiddenCardInfo);

export const Show3x3SubgridNavButtonsStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) =>
        Platform.isMobile
            ? state.view.show3x3SubgridNavButtonsMobile ?? true
            : state.view.show3x3SubgridNavButtonsDesktop ?? true,
    );

export const Show9x9ParallelNavButtonsStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) =>
        Platform.isMobile
            ? state.view.show9x9ParallelNavButtonsMobile ?? true
            : state.view.show9x9ParallelNavButtonsDesktop ?? true,
    );

export const ShowMandalaDetailSidebarStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.showMandalaDetailSidebar,
    );

export const MandalaDetailSidebarWidthStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaDetailSidebarWidth,
    );

export const Show9x9TitleOnlyStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.show9x9TitleOnly);

export const SquareLayoutStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.squareLayout);

export const WhiteThemeModeStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.whiteThemeMode);

export const MandalaBorderOpacityStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaGridBorderOpacity,
    );

export const MandalaSectionColorOpacityStore = (view: MandalaView) =>
    derived(
        view.plugin.settings,
        (state) => state.view.mandalaSectionColorOpacity,
    );

export const HiddenVerticalToolbarButtons = (plugin: MandalaGrid) =>
    derived(
        plugin.settings,
        (state) => state.view.hiddenVerticalToolbarButtons,
    );
