import MandalaGrid from 'src/main';
import { ViewState, WorkspaceLeaf } from 'obsidian';
import { ViewType } from 'src/stores/settings/settings-type';

export const toggleObsidianViewType = (
    plugin: MandalaGrid,
    leaf: WorkspaceLeaf,
    type: ViewType,
) => {
    setTimeout(() => {
        void leaf.setViewState({
            type,
            popstate: true,
            state: leaf.view.getState(),
        } as ViewState);

        plugin.app.workspace.setActiveLeaf(leaf);
    }, 0);
};
