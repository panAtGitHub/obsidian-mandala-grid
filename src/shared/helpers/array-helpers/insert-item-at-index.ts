export const insertItemAtIndex = <T>(array: T[], item: T, index: number) => {
    const copy = [...array];
    copy.splice(index, 0, item);
    return copy;
};
