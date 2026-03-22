import { MandalaView } from 'src/view/view';
import { getElementById } from 'src/shared/lib/align-element/helpers/get-element-by-id';
import { delay } from 'src/shared/helpers/delay';
import { findNearestVerticalScrollPane } from 'src/shared/lib/align-element/helpers/find-scrollable-pane';

const LOOP_DELAY_MS = 10;
const MAX_ATTEMPTS = 100;
const REQUIRED_MATCHES = 20;

export const waitForActiveNodeToStopMoving = async (
    view: MandalaView,
    signal: AbortSignal,
) => {
    const activeBranch = view.viewStore.getValue().document.activeBranch;

    let scrollPane: HTMLElement | null = null;

    let retries = 0;
    let hits = 0;

    let lastScrollTop = -1;
    let lastScrollLeft = -1;

    const container = view.container!;
    while (retries < MAX_ATTEMPTS && !signal.aborted) {
        if (!scrollPane) {
            const activeElement = getElementById(container, activeBranch.node);
            scrollPane = activeElement
                ? findNearestVerticalScrollPane(activeElement, container)
                : null;
            if (!scrollPane) {
                return;
            }
        } else {
            const isStill =
                lastScrollTop === scrollPane.scrollTop &&
                lastScrollLeft === container.scrollLeft;
            if (isStill) {
                hits++;
                if (hits === REQUIRED_MATCHES) return;
            } else {
                hits = 0;
            }
            lastScrollTop = scrollPane.scrollTop;
            lastScrollLeft = container.scrollLeft;
        }
        retries++;
        await delay(LOOP_DELAY_MS);
    }
};
