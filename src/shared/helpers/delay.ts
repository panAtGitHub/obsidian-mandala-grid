export const delay = async (
    milliseconds: number,
    signal?: AbortSignal,
): Promise<void> => {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(), milliseconds);

        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                resolve();
            });
        }
    });
};
