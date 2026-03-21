import { MandalaView } from 'src/view/view';
import { handleGlobalBlockLink } from 'src/cell/display/content/event-handlers/handle-links/block-link/handle-global-block-link';
import { handleLocalBlockLink } from 'src/cell/display/content/event-handlers/handle-links/block-link/handle-local-block-link';

export const handleBlockLink = (
    view: MandalaView,
    link: string,
    modKey: boolean,
) => {
    const viewFilePath = view.file!.basename;
    const match = /(.*)#\^(\S{4,})$/.exec(link);
    if (match) {
        const file = match[1];
        const id = match[2];
        if (!file.trim() || file === viewFilePath) {
            handleLocalBlockLink(view, id);
        } else {
            handleGlobalBlockLink(view, link, modKey);
        }
    }
};
