import type { MandalaThemeSnapshot } from 'src/mandala-cell/model/card-view-model';
import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { WeekPlanContext } from 'src/mandala-display/logic/week-plan-context';
import type { ResolvedGridStyle } from 'src/mandala-scenes/shared/grid-style';
import type { SceneCardInteractionSnapshot } from 'src/mandala-scenes/shared/scene-projection';
import type {
    Nx9WeekSceneProjection,
    Nx9WeekSceneProjectionProps,
    SceneDisplaySnapshot,
} from 'src/mandala-scenes/shared/scene-projection';
import { createNx9WeekRuntime } from 'src/mandala-scenes/view-nx9-week-7x9/runtime';

export const buildNx9WeekSceneProjectionProps = ({
    weekContext,
    themeSnapshot,
    displaySnapshot,
    gridStyle,
    sectionIdMap,
    interactionSnapshot,
    activeCell,
    runtime,
}: {
    weekContext: WeekPlanContext;
    themeSnapshot: MandalaThemeSnapshot;
    displaySnapshot: SceneDisplaySnapshot;
    gridStyle: ResolvedGridStyle;
    sectionIdMap: Record<string, string | undefined>;
    interactionSnapshot: SceneCardInteractionSnapshot;
    activeCell: { row: number; col: number; page?: number } | null;
    runtime: ReturnType<typeof createNx9WeekRuntime>;
}): Nx9WeekSceneProjectionProps => {
    return {
        layoutKind: 'nx9-week-7x9',
        output: {
            descriptors: runtime.resolveCells({
                weekContext,
                sectionIdMap,
                gridStyle,
                displaySnapshot,
                interactionSnapshot,
                activeCell,
            }),
        },
        layoutMeta: {
            displaySnapshot,
            gridStyle,
            themeSnapshot,
        },
    };
};

export const buildNx9WeekSceneProjection = (
    sceneKey: MandalaSceneKey,
    props: Nx9WeekSceneProjectionProps,
): Nx9WeekSceneProjection => ({
    sceneKey,
    rendererKind: 'card-scene',
    props,
});
