import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    type SceneProjection,
    type ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import { buildThreeByThreeSceneProjection } from 'src/mandala-scenes/view-3x3/build-scene-projection';
import { buildWeekLegacySceneProjection } from 'src/mandala-scenes/view-7x9/build-legacy-scene-projection';
import { buildNineByNineLegacySceneProjection } from 'src/mandala-scenes/view-9x9/build-legacy-scene-projection';
import { buildNx9LegacySceneProjection } from 'src/mandala-scenes/view-nx9/build-legacy-scene-projection';

export const buildLegacySceneProjection = (
    sceneKey: MandalaSceneKey,
): SceneProjection => {
    if (sceneKey.viewKind === '9x9') {
        return buildNineByNineLegacySceneProjection(sceneKey);
    }
    if (sceneKey.variant === 'week-7x9') {
        return buildWeekLegacySceneProjection(sceneKey);
    }
    return buildNx9LegacySceneProjection(sceneKey);
};

export const buildSceneProjection = ({
    sceneKey,
    committedSceneKey,
    preparedThreeByThreeProps,
    committedThreeByThreeProps,
}: {
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    preparedThreeByThreeProps: ThreeByThreeSceneProjectionProps;
    committedThreeByThreeProps: ThreeByThreeSceneProjectionProps;
}): SceneProjection =>
    sceneKey.viewKind === '3x3'
        ? buildThreeByThreeSceneProjection({
              sceneKey,
              committedSceneKey,
              preparedProps: preparedThreeByThreeProps,
              committedProps: committedThreeByThreeProps,
          })
        : buildLegacySceneProjection(sceneKey);
