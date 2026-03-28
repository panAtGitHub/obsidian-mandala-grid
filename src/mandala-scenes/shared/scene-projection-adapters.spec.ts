import { describe, expect, it } from 'vitest';
import {
    buildLegacySceneProjection,
    buildSceneProjection,
} from 'src/mandala-scenes/shared/scene-projection-adapters';
import type {
    Nx9WeekSceneProjectionProps,
    ThreeByThreeSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import {
    createSceneCommitSnapshot,
    hasPendingSceneSwitch,
} from 'src/mandala-scenes/shared/scene-switch';
import { resolveCardGridStyle } from 'src/mandala-scenes/shared/grid-style';
import { buildThreeByThreeSceneProjection } from 'src/mandala-scenes/view-3x3/build-scene-projection';

const threeByThreeGridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});

const nx9GridStyle = resolveCardGridStyle({
    whiteThemeMode: false,
});

const preparedProps: ThreeByThreeSceneProjectionProps = {
    layoutKind: '3x3',
    output: {
        descriptors: [],
    },
    layoutMeta: {
        gridStyle: threeByThreeGridStyle,
        theme: '1',
        animateSwap: false,
        show3x3SubgridNavButtons: false,
        hasOpenOverlayModal: false,
        dayPlanEnabled: false,
        showDayPlanTodayButton: false,
        dayPlanTodayTargetSection: '1',
        activeCoreSection: null,
        todayButtonLabel: '',
        enterSubgridFromButton: () => undefined,
        exitSubgridFromButton: () => undefined,
        focusDayPlanTodayFromButton: () => undefined,
        getUpButtonLabel: () => '',
        getDownButtonLabel: () => '',
        onMobileCardDoubleClick: null,
    },
};

const committedProps: ThreeByThreeSceneProjectionProps = {
    ...preparedProps,
    layoutMeta: {
        ...preparedProps.layoutMeta,
        dayPlanTodayTargetSection: '2',
    },
};

const nx9ProjectionProps = {
    layoutKind: 'nx9',
    output: {},
    layoutMeta: {
        documentSnapshot: {
            revision: 1,
            contentRevision: 2,
            sectionIdMap: { '1': 'node-1' },
            documentContent: { 'node-1': { content: 'hello' } },
        },
        themeSnapshot: {
            themeTone: 'light',
            themeUnderlayColor: '#fff',
            activeThemeUnderlayColor: '#eee',
        },
        gridStyle: nx9GridStyle,
        rowsPerPage: 5,
        displaySnapshot: {
            sectionColors: { '1': '#111' },
            sectionColorOpacity: 60,
            backgroundMode: 'custom',
            showDetailSidebar: false,
            whiteThemeMode: false,
        },
        interactionSnapshot: {
            activeNodeId: 'node-1',
            editingState: {
                activeNodeId: 'node-1',
                isInSidebar: false,
            },
            selectedNodes: new Set(['node-1']),
            showDetailSidebar: false,
            selectedStamp: 'node-1',
            pinnedSections: new Set(['1']),
            pinnedStamp: '1',
        },
        activeSection: '1.2',
        activeCoreSection: '1',
        activeCell: { row: 1, col: 2, page: 0 },
    },
} as const;

const nx9WeekProjectionProps: Nx9WeekSceneProjectionProps = {
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
        gridStyle: nx9GridStyle,
        themeSnapshot: {
            themeTone: 'light',
            themeUnderlayColor: '#fff',
            activeThemeUnderlayColor: '#eee',
        },
    },
};

describe('scene-projection-adapters', () => {
    it('builds a legacy projection for non-3x3 scenes', () => {
        expect(
            buildLegacySceneProjection({
                viewKind: '9x9',
                variant: 'default',
            }, {
                nx9WeekProps: nx9WeekProjectionProps,
                nx9Props: nx9ProjectionProps,
            }),
        ).toEqual({
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            rendererKind: '9x9-layout',
            props: {},
        });

        expect(
            buildLegacySceneProjection({
                viewKind: 'nx9',
                variant: 'week-7x9',
            }, {
                nx9WeekProps: nx9WeekProjectionProps,
                nx9Props: nx9ProjectionProps,
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            rendererKind: 'card-scene',
            props: nx9WeekProjectionProps,
        });

        expect(
            buildLegacySceneProjection({
                viewKind: 'nx9',
                variant: 'default',
            }, {
                nx9WeekProps: nx9WeekProjectionProps,
                nx9Props: nx9ProjectionProps,
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            rendererKind: 'card-scene',
            props: {
                ...nx9ProjectionProps,
            },
        });
    });

    it('prefers committed props for steady 3x3 scenes', () => {
        const projection = buildThreeByThreeSceneProjection({
            sceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            preparedProps,
            committedProps,
        });

        expect(projection.rendererKind).toBe('card-scene');
        if (
            projection.rendererKind !== 'card-scene' ||
            projection.props.layoutKind !== '3x3'
        ) {
            throw new Error('expected 3x3 projection');
        }
        expect(projection.props.layoutMeta.dayPlanTodayTargetSection).toBe('2');
    });

    it('falls back to prepared props while prewarming the next 3x3 scene', () => {
        const projection = buildSceneProjection({
            sceneKey: {
                viewKind: '3x3',
                variant: 'day-plan',
            },
            committedSceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            preparedThreeByThreeProps: preparedProps,
            committedThreeByThreeProps: committedProps,
            nx9WeekProps: nx9WeekProjectionProps,
            nx9Props: nx9ProjectionProps,
        });

        expect(projection.rendererKind).toBe('card-scene');
        if (
            projection.rendererKind !== 'card-scene' ||
            projection.props.layoutKind !== '3x3'
        ) {
            throw new Error('expected 3x3 projection');
        }
        expect(projection.props.layoutMeta.dayPlanTodayTargetSection).toBe('1');
    });

    it('covers the main cross-view switch paths with staged projections', () => {
        const weekProjection = buildSceneProjection({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            committedSceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            preparedThreeByThreeProps: preparedProps,
            committedThreeByThreeProps: committedProps,
            nx9WeekProps: nx9WeekProjectionProps,
            nx9Props: nx9ProjectionProps,
        });
        const threeByThreeProjection = buildSceneProjection({
            sceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            preparedThreeByThreeProps: preparedProps,
            committedThreeByThreeProps: committedProps,
            nx9WeekProps: nx9WeekProjectionProps,
            nx9Props: nx9ProjectionProps,
        });
        const nx9Projection = buildSceneProjection({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: '3x3',
                variant: 'default',
            },
            preparedThreeByThreeProps: preparedProps,
            committedThreeByThreeProps: committedProps,
            nx9WeekProps: nx9WeekProjectionProps,
            nx9Props: nx9ProjectionProps,
        });
        const nineByNineProjection = buildSceneProjection({
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
            committedSceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            preparedThreeByThreeProps: preparedProps,
            committedThreeByThreeProps: committedProps,
            nx9WeekProps: nx9WeekProjectionProps,
            nx9Props: nx9ProjectionProps,
        });

        expect(hasPendingSceneSwitch(weekProjection, threeByThreeProjection)).toBe(
            true,
        );
        expect(
            createSceneCommitSnapshot(weekProjection).committedSceneKey,
        ).toEqual({
            viewKind: 'nx9',
            variant: 'week-7x9',
        });

        expect(
            hasPendingSceneSwitch(threeByThreeProjection, nx9Projection),
        ).toBe(true);
        expect(threeByThreeProjection.rendererKind).toBe('card-scene');
        if (
            threeByThreeProjection.rendererKind !== 'card-scene' ||
            threeByThreeProjection.props.layoutKind !== '3x3'
        ) {
            throw new Error('expected 3x3 projection');
        }
        expect(threeByThreeProjection.props.output.descriptors).toBe(
            preparedProps.output.descriptors,
        );

        expect(hasPendingSceneSwitch(nx9Projection, nineByNineProjection)).toBe(
            true,
        );
        expect(
            hasPendingSceneSwitch(
                nineByNineProjection,
                buildSceneProjection({
                    sceneKey: {
                        viewKind: '3x3',
                        variant: 'default',
                    },
                    committedSceneKey: {
                        viewKind: '9x9',
                        variant: 'default',
                    },
                    preparedThreeByThreeProps: preparedProps,
                    committedThreeByThreeProps: committedProps,
                    nx9WeekProps: nx9WeekProjectionProps,
                    nx9Props: nx9ProjectionProps,
                }),
            ),
        ).toBe(true);
    });
});
