import { describe, expect, it } from 'vitest';
import {
    buildWeekSceneProjection,
    buildWeekSceneProjectionProps,
} from 'src/mandala-scenes/view-7x9/build-scene-projection';

describe('build-week-scene-projection', () => {
    it('builds week projection props from frontmatter and anchor state', () => {
        expect(
            buildWeekSceneProjectionProps({
                frontmatter: `---
mandala: true
mandala_plan:
  enabled: true
  year: 2026
  daily_only_3x3: true
---`,
                anchorDate: '2026-01-01',
                weekStart: 'monday',
            }),
        ).toEqual({
            rows: [
                { date: '2025-12-29', coreSection: null, inPlanYear: false },
                { date: '2025-12-30', coreSection: null, inPlanYear: false },
                { date: '2025-12-31', coreSection: null, inPlanYear: false },
                { date: '2026-01-01', coreSection: '1', inPlanYear: true },
                { date: '2026-01-02', coreSection: '2', inPlanYear: true },
                { date: '2026-01-03', coreSection: '3', inPlanYear: true },
                { date: '2026-01-04', coreSection: '4', inPlanYear: true },
            ],
        });
    });

    it('wraps week variants as a dedicated projection', () => {
        expect(
            buildWeekSceneProjection({
                viewKind: 'nx9',
                variant: 'week-7x9',
            }, { rows: [] }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            rendererKind: 'week-layout',
            props: { rows: [] },
        });
    });
});
