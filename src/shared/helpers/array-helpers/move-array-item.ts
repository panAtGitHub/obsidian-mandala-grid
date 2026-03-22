export const moveArrayItem = <T>(
    array: T[],
    fromIndex: number,
    toIndex: number,
) => {
    const newArray = array.slice();
    const element = newArray[fromIndex];
    newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, element);
    return newArray;
};
