export const sortSectionsByDepthDesc = (keys: string[]): string[] => {
    return keys.sort((a, b) => {
        const aParts = a.split('.');
        const bParts = b.split('.');

        return bParts.length - aParts.length;
    });
};
