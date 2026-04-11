import {
    DEFAULT_CELL_SCROLLBAR_MODE,
    type CellScrollbarMode,
} from 'src/mandala-cell/model/cell-scrollbar-mode';

const IDLE_HIDE_MS = 400;
const IDLE_SCROLLBAR_CLASS = 'mandala-idle-scrollbar';
const SCROLLBAR_VISIBLE_CLASS = 'is-scrollbar-visible';
const SCROLLBAR_HAS_OVERFLOW_CLASS = 'has-overlay-scrollbar';
const MIN_THUMB_SIZE = 24;

type HideIdleScrollbarOptions = {
    mode?: CellScrollbarMode;
    enabled?: boolean;
};

const normalizeOptions = (
    options: HideIdleScrollbarOptions | CellScrollbarMode | undefined,
): Required<HideIdleScrollbarOptions> =>
    typeof options === 'string'
        ? {
              mode: options,
              enabled: true,
          }
        : {
              mode: options?.mode ?? DEFAULT_CELL_SCROLLBAR_MODE,
              enabled: options?.enabled ?? true,
          };

export const hideIdleScrollbar = (
    element: HTMLElement,
    options: HideIdleScrollbarOptions | CellScrollbarMode = DEFAULT_CELL_SCROLLBAR_MODE,
) => {
    const { mode, enabled } = normalizeOptions(options);

    if (!enabled) {
        return {
            destroy: () => {},
        };
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const hasIdleDelay = IDLE_HIDE_MS > 0;
    let rafHandle: number | null = null;
    element.classList.add(IDLE_SCROLLBAR_CLASS);

    const clearHideTimer = () => {
        if (!timeoutHandle) return;
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
    };

    const hideScrollbar = () => {
        element.classList.remove(SCROLLBAR_VISIBLE_CLASS);
    };

    const scheduleHide = () => {
        if (mode !== 'interaction') return;
        if (!hasIdleDelay) return;
        clearHideTimer();
        timeoutHandle = setTimeout(hideScrollbar, IDLE_HIDE_MS);
    };

    const revealScrollbar = () => {
        if (mode !== 'interaction') return;
        element.classList.add(SCROLLBAR_VISIBLE_CLASS);
        scheduleHide();
    };

    const updateOverlayMetrics = () => {
        rafHandle = null;
        const { clientHeight, scrollHeight, scrollTop } = element;
        const hasOverflow = scrollHeight - clientHeight > 1;
        element.classList.toggle(SCROLLBAR_HAS_OVERFLOW_CLASS, hasOverflow);

        if (!hasOverflow) {
            element.style.setProperty('--mandala-overlay-scrollbar-thumb-height', '0px');
            element.style.setProperty('--mandala-overlay-scrollbar-thumb-offset', '0px');
            hideScrollbar();
            return;
        }

        const thumbHeight = Math.max(
            MIN_THUMB_SIZE,
            Math.round((clientHeight * clientHeight) / scrollHeight),
        );
        const maxOffset = Math.max(clientHeight - thumbHeight, 0);
        const maxScrollTop = Math.max(scrollHeight - clientHeight, 1);
        const thumbOffset = Math.round((scrollTop / maxScrollTop) * maxOffset);

        element.style.setProperty(
            '--mandala-overlay-scrollbar-thumb-height',
            `${thumbHeight}px`,
        );
        element.style.setProperty(
            '--mandala-overlay-scrollbar-thumb-offset',
            `${thumbOffset}px`,
        );
    };

    const scheduleOverlayMetrics = () => {
        if (rafHandle !== null) return;
        rafHandle = requestAnimationFrame(updateOverlayMetrics);
    };

    const handleScroll = () => {
        scheduleOverlayMetrics();
        revealScrollbar();
    };

    const handleWheel = () => {
        revealScrollbar();
        scheduleOverlayMetrics();
    };

    const resizeObserver = new ResizeObserver(() => {
        scheduleOverlayMetrics();
    });
    const mutationObserver = new MutationObserver(() => {
        scheduleOverlayMetrics();
    });

    resizeObserver.observe(element);
    mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    element.addEventListener('scroll', handleScroll, { passive: true });
    element.addEventListener('wheel', handleWheel, { passive: true });
    scheduleOverlayMetrics();

    return {
        destroy: () => {
            clearHideTimer();
            if (rafHandle !== null) {
                cancelAnimationFrame(rafHandle);
            }
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            element.removeEventListener('scroll', handleScroll);
            element.removeEventListener('wheel', handleWheel);
            element.classList.remove(IDLE_SCROLLBAR_CLASS);
            element.classList.remove(SCROLLBAR_VISIBLE_CLASS);
            element.classList.remove(SCROLLBAR_HAS_OVERFLOW_CLASS);
            element.style.removeProperty('--mandala-overlay-scrollbar-thumb-height');
            element.style.removeProperty('--mandala-overlay-scrollbar-thumb-offset');
        },
    };
};
