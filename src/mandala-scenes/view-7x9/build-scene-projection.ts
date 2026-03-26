import type { WeekPlanRow } from 'src/mandala-display/logic/day-plan';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type {
    WeekSceneProjection,
    WeekSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildWeekSceneProjectionProps = ({
    rows,
}: {
    rows: WeekPlanRow[];
}): WeekSceneProjectionProps => ({
    rows,
});

export const buildWeekSceneProjection = (
    sceneKey: MandalaSceneKey,
    props: WeekSceneProjectionProps,
): WeekSceneProjection => ({
    sceneKey,
    rendererKind: 'week-layout',
    props,
});
