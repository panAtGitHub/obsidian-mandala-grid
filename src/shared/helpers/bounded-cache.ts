export type BoundedCache<T> = {
    get: (key: string) => T | undefined;
    set: (key: string, value: T) => T;
    clear: () => void;
};

export const createBoundedCache = <T>({
    capacity,
}: {
    capacity: number;
}): BoundedCache<T> => {
    const values = new Map<string, T>();

    const touch = (key: string, value: T) => {
        values.delete(key);
        values.set(key, value);
        while (values.size > capacity) {
            const oldestKeyResult = values.keys().next();
            if (oldestKeyResult.done) {
                break;
            }
            values.delete(oldestKeyResult.value);
        }
        return value;
    };

    return {
        get: (key) => {
            const value = values.get(key);
            if (value === undefined) {
                return undefined;
            }
            return touch(key, value);
        },
        set: (key, value) => touch(key, value),
        clear: () => values.clear(),
    };
};

export const createObjectIdentityKeyResolver = ({
    label = 'ref',
}: {
    label?: string;
} = {}) => {
    const ids = new WeakMap<object, number>();
    let nextId = 1;

    return (value: object | null | undefined) => {
        if (!value) {
            return `${label}:null`;
        }
        const cached = ids.get(value);
        if (cached !== undefined) {
            return `${label}:${cached}`;
        }
        const next = nextId;
        nextId += 1;
        ids.set(value, next);
        return `${label}:${next}`;
    };
};
