import { describe, expect, it } from 'vitest';
import { buildNx9LegacySceneProjection } from 'src/mandala-scenes/view-nx9/build-legacy-scene-projection';

describe('build-nx9-legacy-scene-projection', () => {
    it('wraps nx9 default scenes as a dedicated legacy projection', () => {
        expect(
            buildNx9LegacySceneProjection({
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
