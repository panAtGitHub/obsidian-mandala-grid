import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    resolveSceneRendererKind,
    type SceneRendererKind,
    type Nx9SceneProjection,
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
    nx9Props: Nx9SceneProjection['props'];
};

type SceneProjectionBuilder = (
    sceneKey: MandalaSceneKey,
    props: NonThreeByThreeProjectionProps,
) => SceneProjection;

const sceneProjectionBuilders: Record<Exclude<SceneRendererKind, 'card-scene'>, SceneProjectionBuilder> = {
    '9x9-layout': buildNineByNineLegacySceneProjection,
};

export const buildLegacySceneProjection = (
    sceneKey: MandalaSceneKey,
    props: NonThreeByThreeProjectionProps,
): SceneProjection =>
    sceneKey.variant === 'week-7x9'
        ? buildWeekSceneProjection(sceneKey, props.weekProps)
        : sceneKey.viewKind === 'nx9'
          ? buildNx9SceneProjection(sceneKey, props.nx9Props)
          : sceneProjectionBuilders[resolveSceneRendererKind(sceneKey) as Exclude<
                SceneRendererKind,
                'card-scene'
            >](sceneKey, props);

export const buildSceneProjection = ({
    sceneKey,
    committedSceneKey,
    preparedThreeByThreeProps,
    committedThreeByThreeProps,
    weekProps,
    nx9Props,
}: {
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    preparedThreeByThreeProps: ThreeByThreeSceneProjectionProps;
    committedThreeByThreeProps: ThreeByThreeSceneProjectionProps;
    weekProps: WeekSceneProjectionProps;
    nx9Props: Nx9SceneProjection['props'];
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
              nx9Props,
          });
