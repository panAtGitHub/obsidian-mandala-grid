import type { MandalaSceneKey } from 'src/mandala-display/logic/mandala-profile';
import type { NineByNineSceneProjection } from 'src/mandala-scenes/shared/scene-projection';

export const buildNineByNineLegacySceneProjection = (
    sceneKey: MandalaSceneKey,
): NineByNineSceneProjection => ({
    sceneKey,
    rendererKind: '9x9-layout',
    props: {},
});
