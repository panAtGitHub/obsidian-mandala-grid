import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';
import { setActiveCellWeek7x9 } from 'src/mandala-interaction/helpers/set-active-cell-week-7x9';
import { getSceneKeyId } from 'src/mandala-scenes/shared/scene-projection';
import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';
import type { MandalaView } from 'src/view/view';

const clearInactiveSceneCaches = (
    view: MandalaView,
    sceneKey: MandalaSceneKey,
) => {
    if (sceneKey.viewKind !== '9x9' && view.mandalaActiveCell9x9) {
        setActiveCell9x9(view, null);
    }
    if (sceneKey.viewKind !== 'nx9' && view.mandalaActiveCellNx9) {
        setActiveCellNx9(view, null);
    }
    if (sceneKey.variant !== 'week-7x9' && view.mandalaActiveCellWeek7x9) {
        setActiveCellWeek7x9(view, null);
    }
};

export const createSceneCacheCleaner = () => {
    let previousSceneKey: ReturnType<typeof getSceneKeyId> | null = null;

    return (view: MandalaView, sceneKey: MandalaSceneKey) => {
        const nextSceneKey = getSceneKeyId(sceneKey);
        if (previousSceneKey === nextSceneKey) {
            return;
        }

        clearInactiveSceneCaches(view, sceneKey);
        previousSceneKey = nextSceneKey;
    };
};
