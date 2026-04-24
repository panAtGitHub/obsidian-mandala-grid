import { navigateMandalaWeek } from 'src/view/helpers/navigate-mandala-week';
import type { MandalaView } from 'src/view/view';
import { jumpCoreTheme } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme';

export const navigateSharedViewUnit = (
    view: MandalaView,
    direction: 'prev' | 'next',
) => {
    const sceneKey = view.getMandalaSceneKey();

    if (sceneKey.viewKind === 'nx9' && sceneKey.variant === 'week-7x9') {
        navigateMandalaWeek(view, direction);
        return;
    }

    if (sceneKey.viewKind === 'nx9') {
        view.focusNx9Page(direction);
        return;
    }

    jumpCoreTheme(view, direction === 'prev' ? 'up' : 'down');
};
