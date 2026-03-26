import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    resolveSceneRendererKind,
    type SceneRendererKind,
    type SceneProjection,
    type ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import { buildThreeByThreeSceneProjection } from 'src/mandala-scenes/view-3x3/build-scene-projection';
import { buildNineByNineLegacySceneProjection } from 'src/mandala-scenes/view-9x9/build-legacy-scene-projection';
import { buildWeekSceneProjection } from 'src/mandala-scenes/view-7x9/build-scene-projection';
import { buildNx9SceneProjection } from 'src/mandala-scenes/view-nx9/build-scene-projection';

type SceneProjectionBuilder = (sceneKey: MandalaSceneKey) => SceneProjection;

const sceneProjectionBuilders: Record<
    Exclude<SceneRendererKind, '3x3-layout'>,
    SceneProjectionBuilder
> = {
    '9x9-layout': buildNineByNineLegacySceneProjection,
    'nx9-layout': buildNx9SceneProjection,
    'week-layout': buildWeekSceneProjection,
};

export const buildLegacySceneProjection = (
    sceneKey: MandalaSceneKey,
): SceneProjection =>
    sceneProjectionBuilders[resolveSceneRendererKind(sceneKey) as Exclude<
        SceneRendererKind,
        '3x3-layout'
    >](sceneKey);

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
