import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    resolveSceneRendererKind,
    type SceneRendererKind,
    type SceneProjection,
    type ThreeByThreeSceneProjectionProps,
    type WeekSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import { buildThreeByThreeSceneProjection } from 'src/mandala-scenes/view-3x3/build-scene-projection';
import { buildNineByNineLegacySceneProjection } from 'src/mandala-scenes/view-9x9/build-legacy-scene-projection';
import { buildWeekSceneProjection } from 'src/mandala-scenes/view-7x9/build-scene-projection';
import { buildNx9SceneProjection } from 'src/mandala-scenes/view-nx9/build-scene-projection';

type NonThreeByThreeProjectionProps = {
    weekProps: WeekSceneProjectionProps;
};

type SceneProjectionBuilder = (
    sceneKey: MandalaSceneKey,
    props: NonThreeByThreeProjectionProps,
) => SceneProjection;

const sceneProjectionBuilders: Record<Exclude<SceneRendererKind, '3x3-layout'>, SceneProjectionBuilder> = {
    '9x9-layout': buildNineByNineLegacySceneProjection,
    'nx9-layout': buildNx9SceneProjection,
    'week-layout': (sceneKey, props) =>
        buildWeekSceneProjection(sceneKey, props.weekProps),
};

export const buildLegacySceneProjection = (
    sceneKey: MandalaSceneKey,
    props: NonThreeByThreeProjectionProps,
): SceneProjection =>
    sceneProjectionBuilders[resolveSceneRendererKind(sceneKey) as Exclude<
        SceneRendererKind,
        '3x3-layout'
    >](sceneKey, props);

export const buildSceneProjection = ({
    sceneKey,
    committedSceneKey,
    preparedThreeByThreeProps,
    committedThreeByThreeProps,
    weekProps,
}: {
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    preparedThreeByThreeProps: ThreeByThreeSceneProjectionProps;
    committedThreeByThreeProps: ThreeByThreeSceneProjectionProps;
    weekProps: WeekSceneProjectionProps;
}): SceneProjection =>
    sceneKey.viewKind === '3x3'
        ? buildThreeByThreeSceneProjection({
              sceneKey,
              committedSceneKey,
              preparedProps: preparedThreeByThreeProps,
              committedProps: committedThreeByThreeProps,
          })
        : buildLegacySceneProjection(sceneKey, {
              weekProps,
          });
