import { Platform } from 'obsidian';
import {
    findMandalaCustomLayout,
    layoutIdToOrientation,
    resolveDocumentMandalaLayoutId,
} from 'src/mandala-display/logic/grid-layout';
import {
    DEFAULT_NX9_ROWS_PER_PAGE,
} from 'src/mandala-settings/state/settings-type';
import {
    getMandalaWeekAnchorDate,
} from 'src/mandala-scenes/shared/scene-runtime';
import type { FocusTarget, ViewState } from 'src/stores/view/view-state-type';
import type { MandalaView } from 'src/view/view';

export type MandalaUiStateSnapshot = {
    subgridTheme: string;
    focusTarget: FocusTarget | null;
    weekAnchorDate: string | null;
};

export const captureMandalaUiState = (
    viewState: ViewState,
): MandalaUiStateSnapshot => ({
    subgridTheme: viewState.ui.mandala.subgridTheme ?? '1',
    focusTarget: viewState.ui.mandala.focusTarget,
    weekAnchorDate: getMandalaWeekAnchorDate(viewState),
});

export const getCurrentMandalaLayoutId = (
    view: MandalaView,
    settings = view.plugin.settings.getValue(),
) =>
    resolveDocumentMandalaLayoutId({
        path: view.getCurrentFilePath(),
        settings,
    });

export const ensureCurrentFileCustomLayoutAvailable = (
    view: MandalaView,
    path: string,
    settings = view.plugin.settings.getValue(),
) => {
    const persistedMandalaView = settings.documents[path]?.mandalaView;
    const layoutId = persistedMandalaView?.selectedLayoutId;
    const selectedCustomLayout = persistedMandalaView?.selectedCustomLayout;
    if (!layoutId?.startsWith('custom:') || !selectedCustomLayout) {
        return settings;
    }
    const customLayouts = settings.view.mandalaGridCustomLayouts ?? [];
    if (findMandalaCustomLayout(customLayouts, layoutId)) {
        return settings;
    }
    view.plugin.settings.dispatch({
        type: 'settings/view/mandala/add-custom-grid-layout',
        payload: {
            layout: selectedCustomLayout,
        },
    });
    return view.plugin.settings.getValue();
};

export const resolveInitialMandalaDetailSidebarVisible = (
    view: MandalaView,
    settings = view.plugin.settings.getValue(),
) => {
    const path = view.getCurrentFilePath();
    const persisted = path ? settings.documents[path]?.mandalaView : null;
    return Platform.isMobile
        ? persisted?.showDetailSidebarMobile ??
              settings.view.showMandalaDetailSidebarMobile
        : persisted?.showDetailSidebarDesktop ??
              settings.view.showMandalaDetailSidebarDesktop;
};

export const persistCurrentMandalaViewState = (
    view: MandalaView,
    options?: {
        overrides?: {
            selectedLayoutId?: string | null;
            nx9RowsPerPage?: number;
        };
        explicitPath?: string;
    },
) => {
    const path = options?.explicitPath ?? view.getCurrentFilePath();
    if (!path) return;

    const viewState = view.viewStore.getValue();
    const documentState = view.documentStore.getValue();
    if (!documentState.meta.isMandala) return;

    const settings = view.plugin.settings.getValue();
    const activeNodeId = viewState.document.activeNode;
    const lastActiveSection =
        documentState.sections.id_section[activeNodeId] ?? null;
    const subgridTheme = viewState.ui.mandala.subgridTheme ?? null;
    const selectedLayoutId =
        options?.overrides?.selectedLayoutId ??
        resolveDocumentMandalaLayoutId({
            path,
            settings,
        });
    const selectedCustomLayout = selectedLayoutId?.startsWith('custom:')
        ? findMandalaCustomLayout(
              settings.view.mandalaGridCustomLayouts ?? [],
              selectedLayoutId,
          )
        : null;
    const gridOrientation = layoutIdToOrientation(selectedLayoutId);
    const currentMandalaViewState = settings.documents[path]?.mandalaView;
    const nx9RowsPerPage =
        options?.overrides?.nx9RowsPerPage ??
        currentMandalaViewState?.nx9RowsPerPage ??
        DEFAULT_NX9_ROWS_PER_PAGE;
    const showDetailSidebar = viewState.ui.mandala.showDetailSidebar;
    const currentDesktopSidebarVisibility =
        currentMandalaViewState?.showDetailSidebarDesktop ?? null;
    const currentMobileSidebarVisibility =
        currentMandalaViewState?.showDetailSidebarMobile ?? null;
    const nextDesktopSidebarVisibility = Platform.isMobile
        ? currentDesktopSidebarVisibility
        : showDetailSidebar;
    const nextMobileSidebarVisibility = Platform.isMobile
        ? showDetailSidebar
        : currentMobileSidebarVisibility;

    if (
        (currentMandalaViewState?.selectedLayoutId ?? null) ===
            selectedLayoutId &&
        JSON.stringify(currentMandalaViewState?.selectedCustomLayout ?? null) ===
            JSON.stringify(selectedCustomLayout ?? null) &&
        currentMandalaViewState?.gridOrientation === gridOrientation &&
        (currentMandalaViewState?.lastActiveSection ?? null) ===
            lastActiveSection &&
        (currentMandalaViewState?.subgridTheme ?? null) === subgridTheme &&
        (currentMandalaViewState?.nx9RowsPerPage ??
            DEFAULT_NX9_ROWS_PER_PAGE) === nx9RowsPerPage &&
        currentDesktopSidebarVisibility === nextDesktopSidebarVisibility &&
        currentMobileSidebarVisibility === nextMobileSidebarVisibility
    ) {
        return;
    }

    view.plugin.settings.dispatch({
        type: 'settings/documents/persist-mandala-view-state',
        payload: {
            path,
            gridOrientation,
            selectedLayoutId,
            selectedCustomLayout: selectedCustomLayout ?? null,
            lastActiveSection,
            subgridTheme,
            nx9RowsPerPage,
            showDetailSidebarDesktop: nextDesktopSidebarVisibility,
            showDetailSidebarMobile: nextMobileSidebarVisibility,
        },
    });
};

export const restoreMandalaUiState = (
    view: MandalaView,
    nextState: MandalaUiStateSnapshot | undefined,
    fallbackSubgridTheme = '1',
) => {
    const subgridTheme = nextState?.subgridTheme ?? fallbackSubgridTheme;
    const focusTarget = nextState?.focusTarget ?? null;
    const weekAnchorDate = nextState?.weekAnchorDate ?? null;

    view.viewStore.dispatch({
        type: 'view/mandala/subgrid/enter',
        payload: { theme: subgridTheme },
    });
    view.viewStore.dispatch({
        type: 'view/mandala/week-anchor-date/set',
        payload: { date: weekAnchorDate },
    });
    view.viewStore.dispatch({
        type: 'view/mandala/focus-target/set',
        payload: { focusTarget },
    });
    view.viewStore.dispatch({
        type: 'view/mandala/swap/cancel',
    });

    return {
        focusTarget,
    };
};
