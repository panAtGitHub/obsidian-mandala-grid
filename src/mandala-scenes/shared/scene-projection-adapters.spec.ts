import { describe, expect, it } from 'vitest';
import {
    buildLegacySceneProjection,
    buildSceneProjection,
} from 'src/mandala-scenes/shared/scene-projection-adapters';
import type {
    ThreeByThreeSceneProjectionProps,
    WeekSceneProjectionProps,
} from 'src/mandala-scenes/shared/scene-projection';
import {
    createSceneCommitSnapshot,
    hasPendingSceneSwitch,
} from 'src/mandala-scenes/shared/scene-switch';
import { buildThreeByThreeSceneProjection } from 'src/mandala-scenes/view-3x3/build-scene-projection';

const preparedProps: ThreeByThreeSceneProjectionProps = {
    cells: [],
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
};

const committedProps: ThreeByThreeSceneProjectionProps = {
    ...preparedProps,
    dayPlanTodayTargetSection: '2',
};

const nx9ProjectionProps = {
    themeSnapshot: {
        themeTone: 'light',
        themeUnderlayColor: '#fff',
        activeThemeUnderlayColor: '#eee',
    },
    rowsPerPage: 5,
    sectionColors: { '1': '#111' },
    sectionColorOpacity: 60,
    backgroundMode: 'custom',
    showDetailSidebar: false,
    whiteThemeMode: false,
} as const;

const weekProjectionProps: WeekSceneProjectionProps = {
    rows: [],
    compactMode: false,
    sectionColors: {},
    sectionColorOpacity: 60,
    backgroundMode: 'custom',
    showDetailSidebar: false,
    whiteThemeMode: false,
};

describe('scene-projection-adapters', () => {
    it('builds a legacy projection for non-3x3 scenes', () => {
        expect(
            buildLegacySceneProjection({
                viewKind: '9x9',
                variant: 'default',
            }, {
                weekProps: weekProjectionProps,
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
                weekProps: weekProjectionProps,
                nx9Props: nx9ProjectionProps,
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
            rendererKind: 'week-layout',
            props: weekProjectionProps,
        });

        expect(
            buildLegacySceneProjection({
                viewKind: 'nx9',
                variant: 'default',
            }, {
                weekProps: weekProjectionProps,
                nx9Props: nx9ProjectionProps,
            }),
        ).toEqual({
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
            rendererKind: 'nx9-layout',
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

        expect(projection.rendererKind).toBe('3x3-layout');
        if (projection.rendererKind !== '3x3-layout') {
            throw new Error('expected 3x3 projection');
        }
        expect(projection.props.dayPlanTodayTargetSection).toBe('2');
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
            weekProps: weekProjectionProps,
            nx9Props: nx9ProjectionProps,
        });

        expect(projection.rendererKind).toBe('3x3-layout');
        if (projection.rendererKind !== '3x3-layout') {
            throw new Error('expected 3x3 projection');
        }
        expect(projection.props.dayPlanTodayTargetSection).toBe('1');
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
            weekProps: weekProjectionProps,
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
            weekProps: weekProjectionProps,
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
            weekProps: weekProjectionProps,
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
            weekProps: weekProjectionProps,
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
        expect(threeByThreeProjection.rendererKind).toBe('3x3-layout');
        if (threeByThreeProjection.rendererKind !== '3x3-layout') {
            throw new Error('expected 3x3 projection');
        }
        expect(threeByThreeProjection.props.cells).toBe(preparedProps.cells);

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
                    weekProps: weekProjectionProps,
                    nx9Props: nx9ProjectionProps,
                }),
            ),
        ).toBe(true);
    });
});
