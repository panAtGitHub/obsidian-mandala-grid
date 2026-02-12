import MandalaGrid from 'src/main';
import { ViewState, WorkspaceLeaf } from 'obsidian';
import { ViewType } from 'src/stores/settings/settings-type';

export const toggleObsidianViewType = (
    plugin: MandalaGrid,
    leaf: WorkspaceLeaf,
    type: ViewType,
    stateOverride?: Record<string, unknown>,
) => {
    setTimeout(() => {
        const currentState = leaf.view.getState?.() || {};
        void leaf.setViewState({
            type,
            popstate: true,
            state: {
                ...currentState,
                ...(stateOverride || {}),
            },
        } as ViewState);

        plugin.app.workspace.setActiveLeaf(leaf);
    }, 0);
};
