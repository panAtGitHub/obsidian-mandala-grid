import Lineage from 'src/main';
import { LINEAGE_VIEW_TYPE, LineageView } from 'src/view/view';
import { removeStaleDocuments } from 'src/stores/plugin/subscriptions/effects/remove-stale-documents/remove-stale-documents';
import { MarkdownView } from 'obsidian';

export const onWorkspaceEvent = (plugin: Lineage) => {
    const onActiveLeafChangeRef = plugin.app.workspace.on(
        'active-leaf-change',
        (leaf) => {
            const view = leaf?.view;
            if (view instanceof LineageView && view.file?.path) {
                view.plugin.store.dispatch({
                    type: 'plugin/documents/update-active-view-of-document',
                    payload: {
                        path: view.file?.path,
                        viewId: view.id,
                    },
                });
            } else if (view instanceof MarkdownView) {
                const views: [string, string][] = plugin.app.workspace
                    .getLeavesOfType(LINEAGE_VIEW_TYPE)
                    .map((leaf) =>
                        leaf.view instanceof LineageView && leaf.view.file
                            ? [leaf.view.id, leaf.view.file.path]
                            : null,
                    )
                    .filter((x) => x) as [string, string][];
                plugin.store.dispatch({
                    type: 'plugin/documents/refresh-active-view-of-document',
                    payload: { views },
                });
            }
            plugin.store.dispatch({
                type: 'plugin/echo/workspace/active-leaf-change',
            });
        },
    );

    const onResizeRef = plugin.app.workspace.on('resize', () => {
        plugin.store.dispatch({
            type: 'plugin/echo/workspace/resize',
        });
    });

    plugin.app.workspace.onLayoutReady(() => {
        plugin.store.dispatch({
            type: 'plugin/echo/workspace/layout-ready',
        });
        removeStaleDocuments(plugin);
    });
    plugin.registerEvent(onActiveLeafChangeRef);
    plugin.registerEvent(onResizeRef);
};
