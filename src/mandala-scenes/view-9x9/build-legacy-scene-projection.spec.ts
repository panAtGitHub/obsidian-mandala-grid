import { describe, expect, it } from 'vitest';
import { buildNineByNineLegacySceneProjection } from 'src/mandala-scenes/view-9x9/build-legacy-scene-projection';

describe('build-nine-by-nine-legacy-scene-projection', () => {
    it('wraps 9x9 as a dedicated legacy scene projection', () => {
        expect(
            buildNineByNineLegacySceneProjection({
                viewKind: '9x9',
                variant: 'default',
            }),
        ).toEqual({
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            rendererKind: '9x9-layout',
            props: {},
        });
    });
});
