import { MandalaView } from 'src/view/view';
import { handleFileLink } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/file-link/handle-file-link';
import { handleHeading } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/heading-link/handle-heading';
import { handleBlockLink } from 'src/view/components/container/column/components/group/components/card/components/content/event-handlers/handle-links/block-link/handle-block-link';
import { isMacLike } from 'src/view/actions/keyboard-shortcuts/helpers/keyboard-events/mod-key';
import { isSafeExternalUrl } from 'src/view/helpers/link-utils';

export const handleLinks = (view: MandalaView, e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const anchor = target?.closest('a') as
        | HTMLAnchorElement
        | null;
    if (!anchor) return;

    if (!anchor.classList.contains('internal-link')) {
        if (!anchor.classList.contains('external-link')) return;
        const href = anchor.getAttribute('href') ?? '';
        if (!isSafeExternalUrl(href)) return;
        e.preventDefault();
        e.stopPropagation();
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
    }

    e.preventDefault();
    const link = anchor.dataset.href;
    const modKey = isMacLike ? e.metaKey : e.ctrlKey;
    if (!link) return;
    if (link.includes('#^')) {
        e.stopPropagation();
        handleBlockLink(view, link, modKey);
    } else if (link.includes('#')) {
        e.stopPropagation();
        handleHeading(view, link, modKey);
    } else {
        e.stopPropagation();
        handleFileLink(view, link, modKey);
    }
};
