import type { MandalaView } from 'src/view/view';

export const getThreeByThreeSectionDepth = (section: string) =>
    section.split('.').length;

const getParentSection = (section: string) => {
    const lastDot = section.lastIndexOf('.');
    if (lastDot === -1) return null;
    return section.slice(0, lastDot);
};

export const resolveThreeByThreeMaxDepthValue = (
    subgridMaxDepth: number | 'unlimited',
) => {
    if (subgridMaxDepth === 'unlimited') {
        return Number.POSITIVE_INFINITY;
    }
    return subgridMaxDepth;
};

export const resolveThreeByThreeMaxDepth = (view: MandalaView) => {
    const viewSettings = view.getEffectiveMandalaSettings().view;
    return resolveThreeByThreeMaxDepthValue(viewSettings.subgridMaxDepth);
};

export const canUseThreeByThreeThemeAsCenterForMaxDepth = (
    section: string,
    maxDepth: number,
) => {
    const depth = getThreeByThreeSectionDepth(section);
    if (depth <= 1) return true;
    return depth < maxDepth;
};

export const canUseThreeByThreeThemeAsCenter = (
    view: MandalaView,
    section: string,
) =>
    canUseThreeByThreeThemeAsCenterForMaxDepth(
        section,
        resolveThreeByThreeMaxDepth(view),
    );

export const canEnterThreeByThreeTheme = (view: MandalaView, section: string) =>
    canUseThreeByThreeThemeAsCenter(view, section);

export const canExpandThreeByThreeChildren = (
    view: MandalaView,
    section: string,
) => getThreeByThreeSectionDepth(section) < resolveThreeByThreeMaxDepth(view);

export const resolveNearestThreeByThreeCenterThemeForMaxDepth = (
    section: string | null | undefined,
    maxDepth: number,
) => {
    let current: string | null = section?.trim() ? section : '1';

    while (current) {
        if (canUseThreeByThreeThemeAsCenterForMaxDepth(current, maxDepth)) {
            return current;
        }
        current = getParentSection(current);
    }

    return '1';
};

export const resolveNearestThreeByThreeCenterTheme = (
    view: MandalaView,
    section: string | null | undefined,
) =>
    resolveNearestThreeByThreeCenterThemeForMaxDepth(
        section,
        resolveThreeByThreeMaxDepth(view),
    );
