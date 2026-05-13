type DebounceFunction<T extends (...args: unknown[]) => unknown> = (
    ...args: Parameters<T>
) => void;

export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number,
): DebounceFunction<T> => {
    let timeoutId: number | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) window.clearTimeout(timeoutId);

        timeoutId = window.setTimeout(() => {
            func(...args);
        }, delay);
    };
};
