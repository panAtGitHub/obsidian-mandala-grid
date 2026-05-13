type TrailingTimer = {
    schedule: (callback: () => void) => void;
    flush: () => void;
    cancel: () => void;
};

export const createTrailingTimer = (delayMs: number): TrailingTimer => {
    let handle: number | null = null;
    let pending: (() => void) | null = null;

    const cancel = () => {
        if (handle !== null) {
            window.clearTimeout(handle);
            handle = null;
        }
        pending = null;
    };

    return {
        schedule: (callback) => {
            pending = callback;
            if (handle !== null) {
                window.clearTimeout(handle);
            }
            handle = window.setTimeout(() => {
                handle = null;
                const next = pending;
                pending = null;
                next?.();
            }, delayMs);
        },
        flush: () => {
            if (handle !== null) {
                window.clearTimeout(handle);
                handle = null;
            }
            const next = pending;
            pending = null;
            next?.();
        },
        cancel,
    };
};
