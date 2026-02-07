// stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
const isObject = (item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item);

export const deepMerge = <T extends Record<string, unknown>>(
    target: T | Partial<T>,
    ...sources: (T | Partial<T>)[]
): T | Partial<T> => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        const targetRecord = target as Record<string, unknown>;
        const sourceRecord = source as Record<string, unknown>;
        for (const key in sourceRecord) {
            const sourceValue = sourceRecord[key];
            if (isObject(sourceValue)) {
                if (!targetRecord[key]) {
                    Object.assign(targetRecord, { [key]: {} });
                }
                deepMerge(
                    targetRecord[key] as Record<string, unknown>,
                    sourceValue as Record<string, unknown>,
                );
            } else {
                if (typeof targetRecord[key] === 'undefined') {
                    Object.assign(targetRecord, { [key]: sourceValue });
                }
            }
        }
    }

    return deepMerge(target, ...sources);
};
