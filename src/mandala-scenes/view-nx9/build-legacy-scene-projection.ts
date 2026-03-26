import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { Nx9SceneProjection } from 'src/mandala-scenes/shared/scene-projection';

export const buildNx9LegacySceneProjection = (
    sceneKey: MandalaSceneKey,
): Nx9SceneProjection => ({
    sceneKey,
    rendererKind: 'nx9-layout',
    props: {},
});
