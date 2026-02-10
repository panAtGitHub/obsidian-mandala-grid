import { MandalaView } from 'src/view/view';
import { getExistingRightTabGroup } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/helpers/get-existing-right-tab-group';
import { WorkspaceLeaf } from 'obsidian';

export const openFileInExistingRightTabGroup = (
    view: MandalaView,
    link: string,
    activeFilePath: string,
): boolean => {
    const rightTabGroup = getExistingRightTabGroup(view);
    if (!rightTabGroup) return false;
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
        return false;
    const newLeaf = workspaceWithCreateLeaf.createLeafInTabGroup(
        rightTabGroup,
    );
    if (newLeaf) {
        if (link.contains('#')) {
            void view.plugin.app.workspace.openLinkText(
                link,
                activeFilePath,
                'split',
                newLeaf.getViewState(),
            );
        } else {
            const linkedFile =
                view.plugin.app.metadataCache.getFirstLinkpathDest(
                    link,
                    activeFilePath,
                );
            if (linkedFile) {
                void newLeaf.openFile(linkedFile);
                workspace.setActiveLeaf(newLeaf);
                return true;
            }
        }
    }
    return false;
};
