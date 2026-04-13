type TrailingTimer = {
    schedule: (callback: () => void) => void;
    flush: () => void;
    cancel: () => void;
};

export const createTrailingTimer = (delayMs: number): TrailingTimer => {
    let handle: ReturnType<typeof globalThis.setTimeout> | null = null;
    let pending: (() => void) | null = null;

    const cancel = () => {
        if (handle !== null) {
            globalThis.clearTimeout(handle);
            handle = null;
        }
        pending = null;
    };

    return {
        schedule: (callback) => {
            pending = callback;
            if (handle !== null) {
                globalThis.clearTimeout(handle);
            }
            handle = globalThis.setTimeout(() => {
                handle = null;
                const next = pending;
                pending = null;
                next?.();
            }, delayMs);
        },
        flush: () => {
            if (handle !== null) {
                globalThis.clearTimeout(handle);
                handle = null;
            }
            const next = pending;
            pending = null;
            next?.();
        },
        cancel,
    };
};
