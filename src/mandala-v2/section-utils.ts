export const parseSectionParts = (sectionId: string) =>
    sectionId.split('.').map(Number);

export const compareSectionIds = (a: string, b: string) => {
    const aParts = parseSectionParts(a);
    const bParts = parseSectionParts(b);
    const max = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < max; i += 1) {
        const av = aParts[i];
        const bv = bParts[i];
        if (av === undefined) return -1;
        if (bv === undefined) return 1;
        if (av !== bv) return av - bv;
    }
    return 0;
};

export const getParentSection = (sectionId: string) => {
    const lastDot = sectionId.lastIndexOf('.');
    if (lastDot < 0) return null;
    return sectionId.slice(0, lastDot);
};
