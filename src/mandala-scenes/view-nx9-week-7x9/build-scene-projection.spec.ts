import { describe, expect, it } from 'vitest';
import { resolveWeekPlanContext } from 'src/mandala-display/logic/week-plan-context';
import {
    buildNx9WeekSceneProjection,
    buildNx9WeekSceneProjectionProps,
} from 'src/mandala-scenes/view-nx9-week-7x9/build-scene-projection';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import { createNx9WeekRuntime } from 'src/mandala-scenes/view-nx9-week-7x9/runtime';

const compactWeekGridStyle = resolveCardGridStyle({
    whiteThemeMode: true,
    compactMode: true,
});

const regularWeekGridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});

const createInteractionSnapshot = () => ({
    activeNodeId: null,
    editingState: {
        activeNodeId: null,
        isInSidebar: false,
    },
    selectedNodes: new Set<string>(),
    showDetailSidebar: false,
    selectedStamp: '',
    pinnedSections: new Set<string>(),
    pinnedStamp: '',
});

describe('build-nx9-week-scene-projection', () => {
    it('derives grid selection visuals from shared view settings', () => {
        const immersive = buildNx9WeekSceneProjectionProps({
            weekContext: resolveWeekPlanContext({
                frontmatter: '---\nmandala: true\n---',
                anchorDate: '2026-01-01',
                weekStart: 'monday',
            }),
            compactMode: false,
            themeSnapshot: {
                themeTone: 'light',
                themeUnderlayColor: '#fff',
                activeThemeUnderlayColor: '#eee',
            },
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: false,
                whiteThemeMode: false,
            },
            sectionIdMap: {},
            interactionSnapshot: createInteractionSnapshot(),
            activeCell: null,
            runtime: createNx9WeekRuntime(),
        });
        const panorama = buildNx9WeekSceneProjectionProps({
            weekContext: resolveWeekPlanContext({
                frontmatter: '---\nmandala: true\n---',
                anchorDate: '2026-01-01',
                weekStart: 'monday',
            }),
            compactMode: false,
            themeSnapshot: {
                themeTone: 'light',
                themeUnderlayColor: '#fff',
                activeThemeUnderlayColor: '#eee',
            },
            displaySnapshot: {
                sectionColors: {},
                sectionColorOpacity: 60,
                backgroundMode: 'custom',
                showDetailSidebar: false,
                whiteThemeMode: true,
            },
            sectionIdMap: {},
            interactionSnapshot: createInteractionSnapshot(),
            activeCell: null,
            runtime: createNx9WeekRuntime(),
        });

        expect(immersive.layoutMeta.gridStyle).toMatchObject({
            selectionStyle: 'node-active',
            cellDisplayPolicy: {
                preserveActiveBackground: false,
            },
        });
        expect(panorama.layoutMeta.gridStyle).toMatchObject({
            selectionStyle: 'cell-outline',
            cellDisplayPolicy: {
                preserveActiveBackground: true,
            },
        });
    });

    it('builds nx9-week projection props from frontmatter and canonical active cell', () => {
        const props = buildNx9WeekSceneProjectionProps({
            weekContext: resolveWeekPlanContext({
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
            compactMode: true,
            themeSnapshot: {
                themeTone: 'light',
                themeUnderlayColor: '#fff',
                activeThemeUnderlayColor: '#eee',
            },
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
            interactionSnapshot: {
                ...createInteractionSnapshot(),
                activeNodeId: 'node-1',
            },
            activeCell: { row: 3, col: 0, page: 0 },
            runtime: createNx9WeekRuntime(),
        });

        expect(props).toMatchObject({
            layoutKind: 'nx9-week-7x9',
            layoutMeta: {
                displaySnapshot: {
                    sectionColors: { '1': '#111' },
                    sectionColorOpacity: 60,
                    backgroundMode: 'custom',
                    showDetailSidebar: false,
                    whiteThemeMode: true,
                },
                themeSnapshot: {
                    themeTone: 'light',
                },
                gridStyle: compactWeekGridStyle,
            },
        });
        expect(props.output.descriptors).toHaveLength(63);
        expect(props.output.descriptors[27]).toMatchObject({
            row: 3,
            col: 0,
            section: '1',
            nodeId: 'node-1',
            isActiveCell: true,
            isActiveNode: false,
            isTopEdge: false,
            isBottomEdge: false,
            isLeftEdge: true,
            isRightEdge: false,
        });
    });

    it('wraps week variants as a dedicated nx9-week projection', () => {
        expect(
            buildNx9WeekSceneProjection(
                {
                    viewKind: 'nx9',
                    variant: 'week-7x9',
                },
                {
                    layoutKind: 'nx9-week-7x9',
                    output: {
                        descriptors: [],
                    },
                    layoutMeta: {
                        displaySnapshot: {
                            sectionColors: {},
                            sectionColorOpacity: 60,
                            backgroundMode: 'custom',
                            showDetailSidebar: false,
                            whiteThemeMode: false,
                        },
                        themeSnapshot: {
                            themeTone: 'light',
                            themeUnderlayColor: '#fff',
                            activeThemeUnderlayColor: '#eee',
                        },
                        gridStyle: regularWeekGridStyle,
                    },
                },
            ),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            rendererKind: 'card-scene',
            props: {
                layoutKind: 'nx9-week-7x9',
                output: {
                    descriptors: [],
                },
                layoutMeta: {
                    displaySnapshot: {
                        sectionColors: {},
                        sectionColorOpacity: 60,
                        backgroundMode: 'custom',
                        showDetailSidebar: false,
                        whiteThemeMode: false,
                    },
                    themeSnapshot: {
                        themeTone: 'light',
                        themeUnderlayColor: '#fff',
                        activeThemeUnderlayColor: '#eee',
                    },
                    gridStyle: regularWeekGridStyle,
                },
            },
        });
    });
});
