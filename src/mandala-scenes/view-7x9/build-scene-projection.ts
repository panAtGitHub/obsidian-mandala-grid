import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { WeekSceneProjection } from 'src/mandala-scenes/shared/scene-projection';

export const buildWeekSceneProjection = (
    sceneKey: MandalaSceneKey,
): WeekSceneProjection => ({
    sceneKey,
    rendererKind: 'week-layout',
    props: {},
});
