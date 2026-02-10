import { MarkdownView, WorkspaceLeaf } from 'obsidian';
import { setViewType } from 'src/stores/settings/actions/set-view-type';
import { MandalaView, MANDALA_VIEW_TYPE } from 'src/view/view';
import { getExistingRightTabGroup } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/helpers/get-existing-right-tab-group';

const getLeafFromExistingTabGroup = (view: MandalaView) => {
    const rightTabGroup = getExistingRightTabGroup(view);
    if (!rightTabGroup) return null;
    const workspace = view.plugin.app.workspace;
    const workspaceWithCreateLeaf = workspace as typeof workspace & {
        createLeafInTabGroup?: (tabGroup: unknown) => WorkspaceLeaf | null;
    };
    if (
        !(
            'createLeafInTabGroup' in workspaceWithCreateLeaf &&
            typeof workspaceWithCreateLeaf.createLeafInTabGroup === 'function'
        )
    )
        return null;
    return workspaceWithCreateLeaf.createLeafInTabGroup(rightTabGroup);
};

export const openFileAndJumpToLine = async (
    view: MandalaView,
    line: number,
    ch: number,
) => {
    const plugin = view.plugin;
    const file = view.file;
    if (!file) return;

    let leaf = getLeafFromExistingTabGroup(view);
    if (!leaf) {
        leaf = plugin.app.workspace.getLeaf('split');
    }
    setViewType(plugin, file.path, 'markdown');
    await leaf.openFile(file);
    const markdownView = leaf.view as MarkdownView;
    markdownView.editor.setCursor({ line, ch });
    setViewType(plugin, file.path, MANDALA_VIEW_TYPE);
};
