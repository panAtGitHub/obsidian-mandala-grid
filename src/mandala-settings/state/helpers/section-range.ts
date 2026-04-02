export const normalizePositiveIntegerOrNull = (
    value: unknown,
): number | null => {
    if (value === null || value === undefined) return null;
    if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        !Number.isFinite(value) ||
        value < 1
    ) {
        return null;
    }
    return value;
};

export const parsePositiveIntegerInput = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return { valid: true, value: null as number | null };
    if (!/^\d+$/.test(trimmed)) return { valid: false, value: null };
    const value = Number(trimmed);
    if (!Number.isInteger(value) || value < 1) {
        return { valid: false, value: null };
    }
    return { valid: true, value };
};

export const isCoreSectionWithinLimit = (
    section: string,
    max: number | null,
) => {
    if (max === null) return true;
    const coreNumber = Number(section);
    return Number.isInteger(coreNumber) && coreNumber >= 1 && coreNumber <= max;
};

export const resolveMaxSectionExample = (depth: number | null) => {
    if (depth === null) return '不设上限';
    if (depth <= 1) return '1';
    return ['1', ...Array.from({ length: depth - 1 }, () => '8')].join('.');
};
