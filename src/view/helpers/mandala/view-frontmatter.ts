import { debounce } from 'obsidian';
import { get } from 'svelte/store';
import { MandalaView } from 'src/view/view';
import {
    maxZoomLevel,
    minZoomLevel,
} from 'src/stores/settings/reducers/change-zoom-level';
import { setActiveCell9x9 } from 'src/view/helpers/mandala/set-active-cell-9x9';
import {
    mobileInteractionMode,
    setMobileInteractionMode,
} from 'src/stores/view/mobile-interaction-store';

const KEY_SUBGRID_THEME = 'mandala_view_subgrid_theme';
const KEY_ACTIVE_SECTION = 'mandala_view_active_section';
const KEY_ACTIVE_CELL_9X9 = 'mandala_view_active_cell_9x9';
const KEY_MODE = 'mandala_view_mode';
const KEY_ZOOM = 'mandala_view_zoom';
const KEY_LEFT_SIDEBAR = 'mandala_view_left_sidebar';
const KEY_LEFT_SIDEBAR_WIDTH = 'mandala_view_left_sidebar_width';
const KEY_DETAIL_SIDEBAR = 'mandala_view_detail_sidebar';
const KEY_DETAIL_SIDEBAR_WIDTH = 'mandala_view_detail_sidebar_width';
const KEY_INTERACTION_MODE = 'mandala_view_interaction_mode';

type PersistedViewState = {
    subgridTheme: string | null;
    activeSection: string | null;
    activeCell9x9: { row: number; col: number } | null;
    mode: '3x3' | '9x9' | null;
    zoom: number | null;
    leftSidebar: boolean | null;
    leftSidebarWidth: number | null;
    detailSidebar: boolean | null;
    detailSidebarWidth: number | null;
    interactionMode: 'locked' | 'unlocked' | null;
};

const coerceString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value : null;

const coerceNumber = (value: unknown): number | null =>
    typeof value === 'number' && !Number.isNaN(value) ? value : null;

const coerceBoolean = (value: unknown): boolean | null =>
    typeof value === 'boolean' ? value : null;

const coerceMode = (value: unknown): '3x3' | '9x9' | null =>
    value === '3x3' || value === '9x9' ? value : null;

const coerceInteractionMode = (
    value: unknown,
): 'locked' | 'unlocked' | null =>
    value === 'locked' || value === 'unlocked' ? value : null;

const coerceCell = (
    value: unknown,
): { row: number; col: number } | null => {
    if (!value || typeof value !== 'object') return null;
    const row = coerceNumber((value as { row?: unknown }).row);
    const col = coerceNumber((value as { col?: unknown }).col);
    if (row === null || col === null) return null;
    return { row, col };
};

export const readMandalaViewStateFromFrontmatter = (
    view: MandalaView,
): PersistedViewState | null => {
    if (!view.file) return null;
    const cache = view.plugin.app.metadataCache.getFileCache(view.file);
    const frontmatter = cache?.frontmatter;
    if (!frontmatter) return null;

    const subgridTheme = coerceString(frontmatter[KEY_SUBGRID_THEME]);
    const activeSection = coerceString(frontmatter[KEY_ACTIVE_SECTION]);
    const activeCell9x9 = coerceCell(frontmatter[KEY_ACTIVE_CELL_9X9]);
    const mode = coerceMode(frontmatter[KEY_MODE]);
    const zoom = coerceNumber(frontmatter[KEY_ZOOM]);
    const leftSidebar = coerceBoolean(frontmatter[KEY_LEFT_SIDEBAR]);
    const leftSidebarWidth = coerceNumber(frontmatter[KEY_LEFT_SIDEBAR_WIDTH]);
    const detailSidebar = coerceBoolean(frontmatter[KEY_DETAIL_SIDEBAR]);
    const detailSidebarWidth = coerceNumber(
        frontmatter[KEY_DETAIL_SIDEBAR_WIDTH],
    );
    const interactionMode = coerceInteractionMode(
        frontmatter[KEY_INTERACTION_MODE],
    );

    const hasAny =
        subgridTheme ||
        activeSection ||
        activeCell9x9 ||
        mode ||
        zoom !== null ||
        leftSidebar !== null ||
        leftSidebarWidth !== null ||
        detailSidebar !== null ||
        detailSidebarWidth !== null ||
        interactionMode;
    if (!hasAny) return null;

    return {
        subgridTheme,
        activeSection,
        activeCell9x9,
        mode,
        zoom,
        leftSidebar,
        leftSidebarWidth,
        detailSidebar,
        detailSidebarWidth,
        interactionMode,
    };
};

const getCurrentViewState = (view: MandalaView): PersistedViewState => {
    const docState = view.documentStore.getValue();
    const viewState = view.viewStore.getValue();
    const settings = view.plugin.settings.getValue();
    const activeNodeId = viewState.document.activeNode;
    const activeSection =
        activeNodeId ? docState.sections.id_section[activeNodeId] : null;
    const interactionMode = get(mobileInteractionMode);

    return {
        subgridTheme: viewState.ui.mandala.subgridTheme ?? null,
        activeSection,
        activeCell9x9: viewState.ui.mandala.activeCell9x9 ?? null,
        mode: settings.view.mandalaMode ?? null,
        zoom: settings.view.zoomLevel ?? null,
        leftSidebar: settings.view.showLeftSidebar ?? null,
        leftSidebarWidth: settings.view.leftSidebarWidth ?? null,
        detailSidebar: settings.view.showMandalaDetailSidebar ?? null,
        detailSidebarWidth: settings.view.mandalaDetailSidebarWidth ?? null,
        interactionMode,
    };
};

export const persistMandalaViewStateToFrontmatter = (view: MandalaView) => {
    if (!view.file) return;
    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return;

    const state = getCurrentViewState(view);
    void view.plugin.app.fileManager.processFrontMatter(
        view.file,
        (frontmatter) => {
            if (state.subgridTheme) {
                frontmatter[KEY_SUBGRID_THEME] = state.subgridTheme;
            } else {
                delete frontmatter[KEY_SUBGRID_THEME];
            }
            if (state.activeSection) {
                frontmatter[KEY_ACTIVE_SECTION] = state.activeSection;
            } else {
                delete frontmatter[KEY_ACTIVE_SECTION];
            }
            if (state.activeCell9x9) {
                frontmatter[KEY_ACTIVE_CELL_9X9] = state.activeCell9x9;
            } else {
                delete frontmatter[KEY_ACTIVE_CELL_9X9];
            }
            if (state.mode) {
                frontmatter[KEY_MODE] = state.mode;
            } else {
                delete frontmatter[KEY_MODE];
            }
            if (state.zoom !== null) {
                frontmatter[KEY_ZOOM] = state.zoom;
            } else {
                delete frontmatter[KEY_ZOOM];
            }
            if (state.leftSidebar !== null) {
                frontmatter[KEY_LEFT_SIDEBAR] = state.leftSidebar;
            } else {
                delete frontmatter[KEY_LEFT_SIDEBAR];
            }
            if (state.leftSidebarWidth !== null) {
                frontmatter[KEY_LEFT_SIDEBAR_WIDTH] = state.leftSidebarWidth;
            } else {
                delete frontmatter[KEY_LEFT_SIDEBAR_WIDTH];
            }
            if (state.detailSidebar !== null) {
                frontmatter[KEY_DETAIL_SIDEBAR] = state.detailSidebar;
            } else {
                delete frontmatter[KEY_DETAIL_SIDEBAR];
            }
            if (state.detailSidebarWidth !== null) {
                frontmatter[KEY_DETAIL_SIDEBAR_WIDTH] =
                    state.detailSidebarWidth;
            } else {
                delete frontmatter[KEY_DETAIL_SIDEBAR_WIDTH];
            }
            if (state.interactionMode) {
                frontmatter[KEY_INTERACTION_MODE] = state.interactionMode;
            } else {
                delete frontmatter[KEY_INTERACTION_MODE];
            }
        },
    );
};

const persistDebouncers = new Map<string, ReturnType<typeof debounce>>();

export const schedulePersistMandalaViewState = (view: MandalaView) => {
    if (!view.file) return;
    const key = view.file.path;
    let debounced = persistDebouncers.get(key);
    if (!debounced) {
        debounced = debounce(
            () => persistMandalaViewStateToFrontmatter(view),
            500,
        );
        persistDebouncers.set(key, debounced);
    }
    debounced();
};

export const applyMandalaViewStateFromFrontmatter = (view: MandalaView) => {
    const persisted = readMandalaViewStateFromFrontmatter(view);
    if (!persisted) return;

    const settingsStore = view.plugin.settings;
    const settings = settingsStore.getValue();
    if (persisted.mode && persisted.mode !== settings.view.mandalaMode) {
        settingsStore.dispatch({ type: 'settings/view/mandala/toggle-mode' });
    }
    if (persisted.zoom !== null) {
        const clamped = Math.max(
            minZoomLevel,
            Math.min(maxZoomLevel, persisted.zoom),
        );
        if (clamped !== settings.view.zoomLevel) {
            settingsStore.dispatch({
                type: 'settings/view/set-zoom-level',
                payload: { value: clamped },
            });
        }
    }
    if (persisted.leftSidebar !== null) {
        if (persisted.leftSidebar !== settings.view.showLeftSidebar) {
            settingsStore.dispatch({ type: 'view/left-sidebar/toggle' });
        }
    }
    if (persisted.leftSidebarWidth !== null) {
        if (persisted.leftSidebarWidth > 0) {
            settingsStore.dispatch({
                type: 'view/left-sidebar/set-width',
                payload: { width: persisted.leftSidebarWidth },
            });
        }
    }
    if (persisted.detailSidebar !== null) {
        if (
            persisted.detailSidebar !==
            settings.view.showMandalaDetailSidebar
        ) {
            settingsStore.dispatch({
                type: 'view/mandala-detail-sidebar/toggle',
            });
        }
    }
    if (persisted.detailSidebarWidth !== null) {
        if (persisted.detailSidebarWidth > 0) {
            settingsStore.dispatch({
                type: 'view/mandala-detail-sidebar/set-width',
                payload: { width: persisted.detailSidebarWidth },
            });
        }
    }
    if (persisted.interactionMode) {
        if (persisted.interactionMode !== get(mobileInteractionMode)) {
            setMobileInteractionMode(persisted.interactionMode);
        }
    }

    const viewState = view.viewStore.getValue();
    const docState = view.documentStore.getValue();

    if (
        persisted.subgridTheme &&
        persisted.subgridTheme !== viewState.ui.mandala.subgridTheme
    ) {
        view.viewStore.dispatch({
            type: 'view/mandala/subgrid/enter',
            payload: { theme: persisted.subgridTheme },
        });
    }

    if (persisted.activeCell9x9) {
        setActiveCell9x9(view, persisted.activeCell9x9);
    }

    if (persisted.activeSection) {
        const id = docState.sections.section_id[persisted.activeSection];
        if (id) {
            view.viewStore.dispatch({
                type: 'view/set-active-node/mouse-silent',
                payload: { id },
            });
        }
    }
};
