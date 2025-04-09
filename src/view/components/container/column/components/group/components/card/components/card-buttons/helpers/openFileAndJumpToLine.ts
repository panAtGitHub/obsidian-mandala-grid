import { MarkdownView, WorkspaceLeaf } from 'obsidian';
import { setViewType } from 'src/stores/settings/actions/set-view-type';
import { LineageView } from 'src/view/view';
import { getExistingRightTabGroup } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/helpers/get-existing-right-tab-group';

const getLeafFromExistingTabGroup = (view: LineageView) => {
    const rightTabGroup = getExistingRightTabGroup(view);
    if (!rightTabGroup) return null;
    const workspace = view.plugin.app.workspace;
    if (
        !(
            'createLeafInTabGroup' in workspace &&
            typeof workspace.createLeafInTabGroup === 'function'
        )
    )
        return null;
    return workspace.createLeafInTabGroup(
        rightTabGroup,
    ) as WorkspaceLeaf | null;
};

export const openFileAndJumpToLine = async (
    view: LineageView,
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
    setViewType(plugin, file.path, 'lineage');
};
