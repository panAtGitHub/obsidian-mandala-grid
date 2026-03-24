import {
    captureMandalaUiState,
    getCurrentMandalaLayoutId as resolveCurrentMandalaLayoutId,
    persistCurrentMandalaViewState,
    restoreMandalaUiState,
} from 'src/mandala-settings/state/current-file/mandala-view-state';
import { DEFAULT_NX9_ROWS_PER_PAGE } from 'src/mandala-settings/state/settings-type';
import type { MandalaView } from 'src/view/view';

export const getCurrentMandalaLayoutId = (
    view: MandalaView,
    settings = view.plugin.settings.getValue(),
) => resolveCurrentMandalaLayoutId(view, settings);

export const isMandalaDetailSidebarVisible = (view: MandalaView) =>
    view.viewStore.getValue().ui.mandala.showDetailSidebar;

export const toggleCurrentMandalaDetailSidebar = (view: MandalaView) => {
    view.viewStore.dispatch({
        type: 'view/mandala/detail-sidebar/set',
        payload: { open: !isMandalaDetailSidebarVisible(view) },
    });
};

export const getCurrentNx9RowsPerPage = (
    view: MandalaView,
    settings = view.plugin.settings.getValue(),
) => {
    const path = view.getCurrentFilePath();
    const value = path ? settings.documents[path]?.mandalaView?.nx9RowsPerPage : null;
    return typeof value === 'number' && Number.isInteger(value) && value >= 1
        ? value
        : DEFAULT_NX9_ROWS_PER_PAGE;
};

export const setCurrentNx9RowsPerPage = (
    view: MandalaView,
    rowsPerPage: number,
) => {
    if (!Number.isInteger(rowsPerPage) || rowsPerPage < 1) return;
    persistCurrentMandalaViewState(view, {
        overrides: {
            nx9RowsPerPage: rowsPerPage,
        },
    });
};

export const persistCurrentMandalaLayout = (
    view: MandalaView,
    layoutId: string,
) => {
    persistCurrentMandalaViewState(view, {
        overrides: { selectedLayoutId: layoutId },
    });
};

export const persistMandalaUiState = (
    view: MandalaView,
    path: string,
    mandalaUiStateByPath: Map<string, ReturnType<typeof captureMandalaUiState>>,
) => {
    mandalaUiStateByPath.set(path, captureMandalaUiState(view.viewStore.getValue()));
    persistCurrentMandalaViewState(view, { explicitPath: path });
};

export const restoreCachedMandalaUiState = (
    view: MandalaView,
    path: string,
    mandalaUiStateByPath: Map<string, ReturnType<typeof captureMandalaUiState>>,
    fallbackSubgridTheme = '1',
) => {
    restoreMandalaUiState(
        view,
        mandalaUiStateByPath.get(path),
        fallbackSubgridTheme,
    );
};
