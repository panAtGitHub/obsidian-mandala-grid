import {
    BREADCRUMBS_HEIGHT,
    TOOLBAR_HEIGHT,
} from 'src/shared/lib/align-element/constants';

export const calculateScrollTop = (
    elementRect: DOMRect,
    containerRect: DOMRect,
    center: boolean,
) => {
    const viewPortIsTallEnough = containerRect.height >= elementRect.height;
    const deltaTop = containerRect.top + TOOLBAR_HEIGHT - elementRect.top;

    const deltaBottom =
        containerRect.bottom - BREADCRUMBS_HEIGHT - elementRect.bottom;
    const bottomIsVisible = deltaBottom > 0;
    const topIsVisible = deltaTop < 0;

    let scrollTop = 0;
    if (!viewPortIsTallEnough) {
        scrollTop = deltaTop;
    } else if (center) {
        const verticalMiddle = containerRect.height / 2;
        scrollTop =
            verticalMiddle -
            (elementRect.top - containerRect.top + elementRect.height / 2);
    } else {
        if (!topIsVisible) {
            scrollTop = deltaTop;
        } else if (!bottomIsVisible) {
            scrollTop = deltaBottom;
        }
    }
    return scrollTop;
};
