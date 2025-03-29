import { LineageView } from 'src/view/view';
import { getNonExistentLinks } from 'src/stores/view/subscriptions/effects/mark-unresolved-links/helpers/get-non-existent-links';
import { getFileLinkElements } from 'src/stores/view/subscriptions/effects/mark-unresolved-links/helpers/get-file-link-elements';

enum Classes {
    'unresolved' = 'is-unresolved',
}

export const markUnresolvedLinks = (view: LineageView) => {
    const file = view.file;
    if (!file) return;

    const nonExistentLinks = getNonExistentLinks(view.plugin, file);
    const links = getFileLinkElements(view);
    for (const link of links) {
        const isUnresolved =
            link.dataset.href &&
            nonExistentLinks.has(link.dataset.href.split('#')[0]);
        const hasUnresolvedClass = link.hasClass(Classes.unresolved);
        if (isUnresolved) {
            if (!hasUnresolvedClass) {
                link.addClass(Classes.unresolved);
            }
        } else if (hasUnresolvedClass) {
            link.removeClass(Classes.unresolved);
        }
    }
};
