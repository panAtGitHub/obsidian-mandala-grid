import { describe, expect, it } from 'vitest';
import { buildWeekSceneProjection } from 'src/mandala-scenes/view-7x9/build-scene-projection';

describe('build-week-scene-projection', () => {
    it('wraps week variants as a dedicated projection', () => {
        expect(
            buildWeekSceneProjection({
                viewKind: 'nx9',
                variant: 'week-7x9',
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            rendererKind: 'week-layout',
            props: {},
        });
    });
});
