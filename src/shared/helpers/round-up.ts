// roundUp(1.4238024691358024,3) -> 1.424
export const roundUp = (value: number, precision: number) => {
    precision = Math.pow(10, precision);
    return Math.ceil(value * precision) / precision;
};
