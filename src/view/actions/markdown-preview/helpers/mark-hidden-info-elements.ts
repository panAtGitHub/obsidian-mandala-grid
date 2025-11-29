const ID_COMMENT_REGEX = /^<!--\s*ID:\s*\d{13}\s*-->$/;

const markHeadingLinkLine = (element: HTMLElement) => {
    const link = Array.from(element.childNodes).find(
        (node) =>
            node instanceof HTMLElement && node.matches('a.internal-link'),
    ) as HTMLElement | undefined;
    if (!link || link.parentElement !== element) return false;

    const href = link.getAttribute('data-href') || link.getAttribute('href');
    if (!href || !href.includes('#')) return false;

    link.classList.add('lng-hidden-info-part');
    let next: ChildNode | null = link.nextSibling;
    while (next) {
        if (
            next.nodeType === Node.TEXT_NODE &&
            next.textContent?.trim() === ''
        ) {
            next = next.nextSibling;
            continue;
        }
        if (next instanceof HTMLElement && next.tagName === 'BR') {
            next.classList.add('lng-hidden-info-part');
            next = next.nextSibling;
            continue;
        }
        break;
    }
    return true;
};

export const markHiddenInfoElements = (container: HTMLElement) => {
    container.querySelectorAll('h4').forEach((heading) => {
        const next = heading.nextElementSibling as HTMLElement | null;
        if (!next || next.tagName !== 'P') return;
        markHeadingLinkLine(next);
    });

    container.querySelectorAll('.cm-comment').forEach((comment) => {
        const text = comment.textContent?.trim();
        if (!text || !ID_COMMENT_REGEX.test(text)) return;
        const target =
            (comment.closest('.cm-comment') as HTMLElement | null) || comment;
        target.classList.add('lng-hidden-info-part');
    });
};
