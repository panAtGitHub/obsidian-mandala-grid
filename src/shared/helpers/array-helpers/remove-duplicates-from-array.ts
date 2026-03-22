export const removeDuplicatesFromArray = <T>(
    array: T[],
    reverse = false,
): T[] => {
    const uniqueItems = new Set<T>();
    const newArray: T[] = [];
    for (let i = array.length - 1; i >= 0; i--) {
        const item = array[i];
        if (!uniqueItems.has(item)) {
            newArray.push(item);
            uniqueItems.add(item);
        }
    }
    return reverse ? newArray : newArray.reverse();
};
