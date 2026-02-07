import { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';
import { openFileInExistingRightTabGroup } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/helpers/open-file-in-existing-right-tab-group';
import { getLinkPaneType } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/block-link/handle-global-block-link';

export const handleFileLink = (
    view: MandalaView,
    link: string,
    modKey: boolean,
) => {
    const path = view.file?.path;
    if (!link || !path) return;
    if (Platform.isMobile) {
        void view.plugin.app.workspace.openLinkText(link, path, false);
        return;
    }
    const paneType = getLinkPaneType(view, modKey);
    if (paneType === 'tab') {
        void view.plugin.app.workspace.openLinkText(link, path, 'tab');
    } else {
        const success = openFileInExistingRightTabGroup(view, link, path);
        if (!success) {
            void view.plugin.app.workspace.openLinkText(link, path, 'split');
        }
    }
};
