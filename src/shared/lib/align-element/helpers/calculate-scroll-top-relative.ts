import {
    BREADCRUMBS_HEIGHT,
    TOOLBAR_HEIGHT,
} from 'src/shared/lib/align-element/constants';

import { PartialDOMRect } from 'src/stores/view/subscriptions/effects/align-branch/helpers/create-context';

export const calculateScrollTopRelative = (
    elementRect: DOMRect,
    containerRect: DOMRect,
    activeCardRect: PartialDOMRect,
) => {
    const viewPortIsTallEnough = containerRect.height >= elementRect.height;
    const deltaTop = containerRect.top + TOOLBAR_HEIGHT - elementRect.top;

    let scrollTop = 0;

    if (!viewPortIsTallEnough) {
        scrollTop = deltaTop;
    } else {
        const verticalMiddle = activeCardRect.top + activeCardRect.height / 2;
        scrollTop = verticalMiddle - (elementRect.top + elementRect.height / 2);

        const elementTopVisible =
            elementRect.top + scrollTop >= containerRect.top + TOOLBAR_HEIGHT;
        const elementBottomVisible =
            elementRect.bottom + scrollTop <=
            containerRect.bottom - BREADCRUMBS_HEIGHT;

        if (!elementTopVisible) {
            scrollTop +=
                containerRect.top +
                TOOLBAR_HEIGHT -
                (elementRect.top + scrollTop);
        } else if (!elementBottomVisible) {
            scrollTop +=
                containerRect.bottom -
                BREADCRUMBS_HEIGHT -
                (elementRect.bottom + scrollTop);
        }
    }

    return scrollTop;
};
