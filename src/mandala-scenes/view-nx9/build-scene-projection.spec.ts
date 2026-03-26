import { describe, expect, it } from 'vitest';
import { buildNx9SceneProjection } from 'src/mandala-scenes/view-nx9/build-scene-projection';

describe('build-nx9-scene-projection', () => {
    it('wraps nx9 default scenes as a dedicated projection', () => {
        expect(
            buildNx9SceneProjection({
                viewKind: 'nx9',
                variant: 'default',
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            rendererKind: 'nx9-layout',
            props: {},
        });
    });
});
