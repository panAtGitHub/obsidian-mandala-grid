/** Retry after editing ends; never cool in the middle of a synchronous action. */
export const createWorkingSetCooldown = (
    tryCool: () => boolean,
    delayMs = 1200,
) => {
    let timer: number | null = null;
    const cancel = () => {
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
    };
    const schedule = () => {
        cancel();
        timer = window.setTimeout(() => {
            timer = null;
            if (!tryCool()) schedule();
        }, delayMs);
    };
    return { schedule, cancel };
};
