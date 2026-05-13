export const delay = async (
    milliseconds: number,
    signal?: AbortSignal,
): Promise<void> => {
    return new Promise((resolve) => {
        const timeout = window.setTimeout(() => resolve(), milliseconds);

        if (signal) {
            signal.addEventListener('abort', () => {
                window.clearTimeout(timeout);
                resolve();
            });
        }
    });
};
