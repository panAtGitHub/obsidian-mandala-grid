import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    resolveSceneRendererKind,
    type SceneRendererKind,
    type Nx9WeekSceneProjectionProps,
    type Nx9SceneProjection,
    type SceneProjection,
    type ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import { buildThreeByThreeSceneProjection } from 'src/mandala-scenes/view-3x3/build-scene-projection';
import { buildNineByNineLegacySceneProjection } from 'src/mandala-scenes/view-9x9/build-legacy-scene-projection';
import { buildNx9WeekSceneProjection } from 'src/mandala-scenes/view-nx9-week-7x9/build-scene-projection';
import { buildNx9SceneProjection } from 'src/mandala-scenes/view-nx9/build-scene-projection';

type NonThreeByThreeProjectionProps = {
    nx9WeekProps: Nx9WeekSceneProjectionProps;
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
        ? buildNx9WeekSceneProjection(sceneKey, props.nx9WeekProps)
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
    nx9WeekProps,
    nx9Props,
}: {
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    preparedThreeByThreeProps: ThreeByThreeSceneProjectionProps;
    committedThreeByThreeProps: ThreeByThreeSceneProjectionProps;
    nx9WeekProps: Nx9WeekSceneProjectionProps;
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
              nx9WeekProps,
              nx9Props,
          });
