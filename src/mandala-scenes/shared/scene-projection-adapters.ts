import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    shouldUseCommittedSceneProjection,
    type SceneProjection,
    type ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';

export const buildLegacySceneProjection = (
    sceneKey: MandalaSceneKey,
): SceneProjection => {
    if (sceneKey.viewKind === '9x9') {
        return {
            sceneKey,
            rendererKind: '9x9-layout',
            props: {},
        };
    }
    if (sceneKey.variant === 'week-7x9') {
        return {
            sceneKey,
            rendererKind: 'week-layout',
            props: {},
        };
    }
    return {
        sceneKey,
        rendererKind: 'nx9-layout',
        props: {},
    };
};

export const buildThreeByThreeSceneProjection = ({
    sceneKey,
    committedSceneKey,
    preparedProps,
    committedProps,
}: {
    sceneKey: MandalaSceneKey;
    committedSceneKey: MandalaSceneKey;
    preparedProps: ThreeByThreeSceneProjectionProps;
    committedProps: ThreeByThreeSceneProjectionProps;
}): SceneProjection => ({
    sceneKey,
    rendererKind: '3x3-layout',
    props: shouldUseCommittedSceneProjection(sceneKey, committedSceneKey)
        ? committedProps
        : preparedProps,
});

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
