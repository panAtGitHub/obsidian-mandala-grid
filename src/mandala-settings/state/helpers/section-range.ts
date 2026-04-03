export type RangeLimitValue = number | 'unlimited';

export const normalizePositiveIntegerOrUnlimited = (
    value: unknown,
): RangeLimitValue => {
    if (value === null || value === undefined || value === 'unlimited') {
        return 'unlimited';
    }
    if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        !Number.isFinite(value) ||
        value < 1
    ) {
        return 'unlimited';
    }
    return value;
};

export const parsePositiveIntegerInput = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed)
        return { valid: true, value: 'unlimited' as RangeLimitValue };
    if (!/^\d+$/.test(trimmed))
        return { valid: false, value: 'unlimited' as RangeLimitValue };
    const value = Number(trimmed);
    if (!Number.isInteger(value) || value < 1) {
        return { valid: false, value: 'unlimited' as RangeLimitValue };
    }
    return { valid: true, value };
};

export const isCoreSectionWithinLimit = (
    section: string,
    max: RangeLimitValue,
) => {
    if (max === 'unlimited') return true;
    const coreNumber = Number(section);
    return Number.isInteger(coreNumber) && coreNumber >= 1 && coreNumber <= max;
};

export const resolveMaxSectionExample = (depth: RangeLimitValue) => {
    if (depth === 'unlimited') return '不设上限';
    if (depth <= 1) return '1';
    return ['1', ...Array.from({ length: depth - 1 }, () => '8')].join('.');
};
