import {
    resolveWeekPlanContext,
} from 'src/mandala-display/logic/week-plan-context';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { WeekStart } from 'src/mandala-settings/state/settings-type';
import type {
    WeekSceneProjection,
    WeekSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildWeekSceneProjectionProps = ({
    frontmatter,
    anchorDate,
    weekStart,
}: {
    frontmatter: string;
    anchorDate: string | null | undefined;
    weekStart: WeekStart;
}): WeekSceneProjectionProps => ({
    rows: resolveWeekPlanContext({
        frontmatter,
        anchorDate,
        weekStart,
    }).rows,
});

export const buildWeekSceneProjection = (
    sceneKey: MandalaSceneKey,
    props: WeekSceneProjectionProps,
): WeekSceneProjection => ({
    sceneKey,
    rendererKind: 'week-layout',
    props,
});
