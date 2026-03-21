import { MandalaView } from 'src/view/view';
import { handleGlobalBlockLink } from 'src/cell/display/content/event-handlers/handle-links/block-link/handle-global-block-link';
import { getCurrentFileSubpath } from 'src/cell/display/content/event-handlers/handle-links/helpers/get-current-file-subpath';

export const handleHeading = (
    view: MandalaView,
    link: string,
    modKey: boolean,
) => {
    const currentFilePath = view.file?.path;
    if (currentFilePath) {
        const currentFileSubpath = getCurrentFileSubpath({
            link,
            currentFilePath,
            resolveFirstLinkpathDest: (path, sourcePath) =>
                view.plugin.app.metadataCache.getFirstLinkpathDest(
                    path,
                    sourcePath,
                ),
        });
        if (currentFileSubpath) {
            view.setEphemeralState({ subpath: currentFileSubpath });
            return;
        }
    }

    handleGlobalBlockLink(view, link, modKey);
};
