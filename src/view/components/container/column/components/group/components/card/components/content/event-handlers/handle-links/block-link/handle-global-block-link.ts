import { MandalaView } from 'src/view/view';
import { Platform } from 'obsidian';

export const getLinkPaneType = (view: MandalaView, modKey: boolean) => {
    const linkPaneType = view.plugin.settings.getValue().general.linkPaneType;
    if (modKey) {
        return linkPaneType === 'tab' ? 'split' : 'tab';
    } else {
        return linkPaneType;
    }
};

export const handleGlobalBlockLink = (
    view: MandalaView,
    link: string,
    modKey: boolean,
) => {
    if (Platform.isMobile) {
        const sourcePath = view.file?.path || view.file!.basename;
        void view.plugin.app.workspace.openLinkText(link, sourcePath, false);
        return;
    }
    void view.plugin.app.workspace.openLinkText(
        link,
        view.file!.basename,
        getLinkPaneType(view, modKey),
    );
};
