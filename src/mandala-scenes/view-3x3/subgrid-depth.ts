import type { MandalaView } from 'src/view/view';

const getSectionDepth = (section: string) => section.split('.').length;

export const resolveThreeByThreeMaxDepth = (view: MandalaView) => {
    const viewSettings = view.getEffectiveMandalaSettings().view;
    if (viewSettings.subgridMaxDepth === null) {
        return Number.POSITIVE_INFINITY;
    }
    return viewSettings.subgridMaxDepth;
};

export const canEnterThreeByThreeTheme = (
    view: MandalaView,
    section: string,
) => getSectionDepth(section) <= resolveThreeByThreeMaxDepth(view);

export const canExpandThreeByThreeChildren = (
    view: MandalaView,
    section: string,
) => getSectionDepth(section) < resolveThreeByThreeMaxDepth(view);
