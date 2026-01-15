import { MandalaView } from 'src/view/view';
import { derived } from 'src/lib/store/derived';
import MandalaGrid from 'src/main';

export const ViewSettingsStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view);

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

export const MaintainEditMode = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.maintainEditMode);

export const AlwaysShowCardButtons = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.alwaysShowCardButtons);

export const ShowHiddenCardInfoStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.showHiddenCardInfo);

export const ShowMandalaDetailSidebarStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.showMandalaDetailSidebar);

export const MandalaDetailSidebarWidthStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.mandalaDetailSidebarWidth);

export const Show9x9TitleOnlyStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.show9x9TitleOnly);

export const SquareLayoutStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.squareLayout);

export const WhiteThemeModeStore = (view: MandalaView) =>
    derived(view.plugin.settings, (state) => state.view.whiteThemeMode);

export const HiddenVerticalToolbarButtons = (plugin: MandalaGrid) =>
    derived(
        plugin.settings,
        (state) => state.view.hiddenVerticalToolbarButtons,
    );
