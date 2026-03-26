import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import {
    shouldUseCommittedSceneProjection,
    type SceneProjection,
    type ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';

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
