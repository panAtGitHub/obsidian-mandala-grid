import {
    DEFAULT_CELL_SCROLLBAR_MODE,
    type CellScrollbarMode,
} from 'src/mandala-cell/model/cell-scrollbar-mode';

const IDLE_HIDE_MS = 1200;
const IDLE_SCROLLBAR_CLASS = 'mandala-idle-scrollbar';
const SCROLLBAR_VISIBLE_CLASS = 'is-scrollbar-visible';
const SCROLL_REVEAL_WINDOW_MS = 900;

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
    let pointerInside = false;
    let lastDirectScrollAt = 0;
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

    const handleScroll = () => {
        if (
            element.classList.contains(SCROLLBAR_VISIBLE_CLASS) ||
            pointerInside ||
            Date.now() - lastDirectScrollAt <= SCROLL_REVEAL_WINDOW_MS
        ) {
            revealScrollbar();
        }
    };

    const handleWheel = () => {
        lastDirectScrollAt = Date.now();
        revealScrollbar();
    };

    const handleTouchMove = () => {
        lastDirectScrollAt = Date.now();
        revealScrollbar();
    };

    const handlePointerEnter = () => {
        pointerInside = true;
    };

    const handlePointerLeave = () => {
        pointerInside = false;
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    element.addEventListener('wheel', handleWheel, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('pointerenter', handlePointerEnter, {
        passive: true,
    });
    element.addEventListener('pointerleave', handlePointerLeave, {
        passive: true,
    });
    return {
        destroy: () => {
            clearHideTimer();
            element.removeEventListener('scroll', handleScroll);
            element.removeEventListener('wheel', handleWheel);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('pointerenter', handlePointerEnter);
            element.removeEventListener('pointerleave', handlePointerLeave);
            element.classList.remove(IDLE_SCROLLBAR_CLASS);
            element.classList.remove(SCROLLBAR_VISIBLE_CLASS);
        },
    };
};
