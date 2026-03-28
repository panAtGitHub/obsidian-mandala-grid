import {
    sceneKeyEquals,
    type SceneProjection,
    type ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';

export type SceneCommitSnapshot = {
    committedSceneKey: SceneProjection['sceneKey'];
    renderedThreeByThreeProps: ThreeByThreeSceneProjectionProps | null;
};

export const hasPendingSceneSwitch = (
    renderedProjection: SceneProjection,
    pendingProjection: SceneProjection,
) => !sceneKeyEquals(renderedProjection.sceneKey, pendingProjection.sceneKey);

export const createSceneCommitSnapshot = (
    projection: SceneProjection,
): SceneCommitSnapshot => ({
    committedSceneKey: projection.sceneKey,
    renderedThreeByThreeProps:
        projection.rendererKind === 'card-scene' &&
        projection.props.layoutKind === '3x3'
            ? projection.props
            : null,
});
