import {
    DEFAULT_CELL_SCROLLBAR_MODE,
    type CellScrollbarMode,
} from 'src/mandala-cell/model/cell-scrollbar-mode';

const IDLE_HIDE_MS = 400;
const IDLE_SCROLLBAR_CLASS = 'mandala-idle-scrollbar';
const SCROLLBAR_VISIBLE_CLASS = 'is-scrollbar-visible';

const REVEAL_EVENTS = ['wheel', 'scroll'] as const;

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
    element.classList.add(IDLE_SCROLLBAR_CLASS);

    if (mode !== 'interaction') {
        return {
            destroy: () => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                element.classList.remove(IDLE_SCROLLBAR_CLASS);
                element.classList.remove(SCROLLBAR_VISIBLE_CLASS);
            },
        };
    }

    const clearHideTimer = () => {
        if (!timeoutHandle) return;
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
    };

    const hideScrollbar = () => {
        element.classList.remove(SCROLLBAR_VISIBLE_CLASS);
    };

    const scheduleHide = () => {
        if (!hasIdleDelay) return;
        clearHideTimer();
        timeoutHandle = setTimeout(hideScrollbar, IDLE_HIDE_MS);
    };

    const revealScrollbar = () => {
        element.classList.add(SCROLLBAR_VISIBLE_CLASS);
        scheduleHide();
    };

    REVEAL_EVENTS.forEach((eventName) => {
        element.addEventListener(eventName, revealScrollbar, { passive: true });
    });

    return {
        destroy: () => {
            clearHideTimer();
            REVEAL_EVENTS.forEach((eventName) => {
                element.removeEventListener(eventName, revealScrollbar);
            });
            element.classList.remove(IDLE_SCROLLBAR_CLASS);
            element.classList.remove(SCROLLBAR_VISIBLE_CLASS);
        },
    };
};
