export const isEmptyMandalaContent = (value: string) =>
    value.trim().length === 0;

export const isNonEmptyMandalaContent = (value: string) =>
    !isEmptyMandalaContent(value);
