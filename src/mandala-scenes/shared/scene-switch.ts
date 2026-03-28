import {
    sceneKeyEquals,
    type SceneProjection,
} from 'src/mandala-scenes/shared/scene-projection';

export type SceneCommitSnapshot = {
    committedSceneKey: SceneProjection['sceneKey'];
};

export const hasPendingSceneSwitch = (
    renderedProjection: SceneProjection,
    pendingProjection: SceneProjection,
) => !sceneKeyEquals(renderedProjection.sceneKey, pendingProjection.sceneKey);

export const createSceneCommitSnapshot = (
    projection: SceneProjection,
): SceneCommitSnapshot => ({
    committedSceneKey: projection.sceneKey,
});
