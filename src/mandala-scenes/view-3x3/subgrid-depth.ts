import type { MandalaView } from 'src/view/view';

const getSectionDepth = (section: string) => section.split('.').length;

export const resolveThreeByThreeMaxDepth = (view: MandalaView) => {
    const viewSettings = view.plugin.settings.getValue().view;
    if (viewSettings.enable3x3InfiniteNesting ?? true) {
        return Number.POSITIVE_INFINITY;
    }

    // "一层" = 仍保留 1.1~1.8；9x9 开启时再允许到 1.1.1~1.8.8。
    return (viewSettings.enable9x9View ?? true) ? 3 : 2;
};

export const canEnterThreeByThreeTheme = (
    view: MandalaView,
    section: string,
) => getSectionDepth(section) <= resolveThreeByThreeMaxDepth(view);

export const canExpandThreeByThreeChildren = (
    view: MandalaView,
    section: string,
) => getSectionDepth(section) < resolveThreeByThreeMaxDepth(view);
