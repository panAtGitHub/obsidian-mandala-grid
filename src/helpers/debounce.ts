type DebounceFunction<T extends (...args: unknown[]) => unknown> = (
    ...args: Parameters<T>
) => void;

export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number,
): DebounceFunction<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};
