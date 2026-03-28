import { describe, expect, it } from 'vitest';
import {
    buildWeekSceneProjection,
    buildWeekSceneProjectionProps,
} from 'src/mandala-scenes/view-7x9/build-scene-projection';

describe('build-week-scene-projection', () => {
    it('builds week projection props from frontmatter and anchor state', () => {
        const props = buildWeekSceneProjectionProps({
            frontmatter: `---
mandala: true
mandala_plan:
  enabled: true
  year: 2026
  daily_only_3x3: true
---`,
            anchorDate: '2026-01-01',
            weekStart: 'monday',
            compactMode: true,
            displaySnapshot: {
                sectionColors: { '1': '#111' },
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: false,
                whiteThemeMode: true,
            },
            sectionIdMap: {
                '1': 'node-1',
            },
            documentContent: {
                'node-1': {
                    content: '# 标题\n正文内容',
                },
            },
            activeNodeId: 'node-1',
            activeCell: { row: 3, col: 0 },
            editingState: {
                activeNodeId: null,
                isInSidebar: false,
            },
            selectedNodes: new Set<string>(),
            pinnedSections: new Set<string>(),
        });

        expect(props).toMatchObject({
            layoutKind: 'week',
            rows: [
                { date: '2025-12-29', coreSection: null, inPlanYear: false },
                { date: '2025-12-30', coreSection: null, inPlanYear: false },
                { date: '2025-12-31', coreSection: null, inPlanYear: false },
                { date: '2026-01-01', coreSection: '1', inPlanYear: true },
                { date: '2026-01-02', coreSection: '2', inPlanYear: true },
                { date: '2026-01-03', coreSection: '3', inPlanYear: true },
                { date: '2026-01-04', coreSection: '4', inPlanYear: true },
            ],
            compactMode: true,
            displaySnapshot: {
                sectionColors: { '1': '#111' },
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: false,
                whiteThemeMode: true,
            },
        });
        expect(props.desktopCells).toHaveLength(63);
        expect(props.mobileCells[27]).toMatchObject({
            row: 3,
            col: 0,
            section: '1',
            nodeId: 'node-1',
            title: '标题',
            body: '正文内容',
            isActiveCell: true,
            isActiveNode: false,
        });
        expect(props.desktopCells[27]).toMatchObject({
            row: 3,
            col: 0,
            section: '1',
            nodeId: 'node-1',
        });
    });

    it('wraps week variants as a dedicated projection', () => {
        expect(
            buildWeekSceneProjection({
                viewKind: 'nx9',
                variant: 'week-7x9',
            }, {
                rows: [],
                desktopCells: [],
                mobileCells: [],
                compactMode: false,
                displaySnapshot: {
                    sectionColors: {},
                    sectionColorOpacity: 60,
                    backgroundMode: 'custom',
                    showDetailSidebar: false,
                    whiteThemeMode: false,
                },
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            rendererKind: 'card-scene',
            props: {
                layoutKind: 'week',
                rows: [],
                desktopCells: [],
                mobileCells: [],
                compactMode: false,
                displaySnapshot: {
                    sectionColors: {},
                    sectionColorOpacity: 60,
                    backgroundMode: 'custom',
                    showDetailSidebar: false,
                    whiteThemeMode: false,
                },
            },
        });
    });
});
