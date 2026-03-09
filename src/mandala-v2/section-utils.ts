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

export const isSectionInSubtree = (sectionId: string, rootSection: string) =>
    sectionId === rootSection || sectionId.startsWith(`${rootSection}.`);

export const swapSectionPrefix = (
    sectionId: string,
    fromSection: string,
    toSection: string,
) => {
    if (sectionId === fromSection) return toSection;
    return `${toSection}${sectionId.slice(fromSection.length)}`;
};

export const swapSectionSubtreeIds = (
    sectionIds: string[],
    sourceSection: string,
    targetSection: string,
) =>
    Array.from(
        new Set(
            sectionIds.map((sectionId) => {
                if (isSectionInSubtree(sectionId, sourceSection)) {
                    return swapSectionPrefix(
                        sectionId,
                        sourceSection,
                        targetSection,
                    );
                }
                if (isSectionInSubtree(sectionId, targetSection)) {
                    return swapSectionPrefix(
                        sectionId,
                        targetSection,
                        sourceSection,
                    );
                }
                return sectionId;
            }),
        ),
    ).sort(compareSectionIds);
