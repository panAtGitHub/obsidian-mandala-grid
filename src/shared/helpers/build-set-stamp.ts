export const buildSetStamp = (values: Iterable<string>) =>
    Array.from(values).sort().join('|');
