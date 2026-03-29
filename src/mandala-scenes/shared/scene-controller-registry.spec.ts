import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    SceneController,
    SceneRootContext,
} from 'src/mandala-scenes/shared/scene-projection';

const threeByThreeResolve = vi.fn();
const dayPlanResolve = vi.fn();
const nx9Resolve = vi.fn();
const weekResolve = vi.fn();
const nineByNineResolve = vi.fn();

vi.mock('src/mandala-scenes/view-3x3/controller', () => ({
    createThreeByThreeControllerCore: () => ({}),
    createThreeByThreeController: () =>
        ({
            resolveProjection: threeByThreeResolve,
        }) satisfies SceneController,
}));

vi.mock('src/mandala-scenes/view-3x3-day-plan/controller', () => ({
    createThreeByThreeDayPlanController: () =>
        ({
            resolveProjection: dayPlanResolve,
        }) satisfies SceneController,
}));

vi.mock('src/mandala-scenes/view-nx9/controller', () => ({
    createNx9Controller: () =>
        ({
            resolveProjection: nx9Resolve,
        }) satisfies SceneController,
}));

vi.mock('src/mandala-scenes/view-nx9-week-7x9/controller', () => ({
    createNx9WeekController: () =>
        ({
            resolveProjection: weekResolve,
        }) satisfies SceneController,
}));

vi.mock('src/mandala-scenes/view-9x9/controller', () => ({
    createNineByNineController: () =>
        ({
            resolveProjection: nineByNineResolve,
        }) satisfies SceneController,
}));

import { createSceneControllerRegistry } from 'src/mandala-scenes/shared/scene-controller-registry';

const baseContext = {
    sceneKey: {
        viewKind: '3x3',
        variant: 'default',
    } as const,
} as Partial<SceneRootContext>;

describe('scene-controller-registry', () => {
    beforeEach(() => {
        threeByThreeResolve.mockReset();
        dayPlanResolve.mockReset();
        nx9Resolve.mockReset();
        weekResolve.mockReset();
        nineByNineResolve.mockReset();
    });

    it('routes projections through the scene-specific controller', () => {
        const registry = createSceneControllerRegistry({} as never);

        registry.resolve(baseContext as SceneRootContext);
        expect(threeByThreeResolve).toHaveBeenCalledTimes(1);

        registry.resolve({
            ...baseContext,
            sceneKey: {
                viewKind: '3x3',
                variant: 'day-plan',
            },
        } as SceneRootContext);
        expect(dayPlanResolve).toHaveBeenCalledTimes(1);

        registry.resolve({
            ...baseContext,
            sceneKey: {
                viewKind: 'nx9',
                variant: 'default',
            },
        } as SceneRootContext);
        expect(nx9Resolve).toHaveBeenCalledTimes(1);

        registry.resolve({
            ...baseContext,
            sceneKey: {
                viewKind: 'nx9',
                variant: 'week-7x9',
            },
        } as SceneRootContext);
        expect(weekResolve).toHaveBeenCalledTimes(1);

        registry.resolve({
            ...baseContext,
            sceneKey: {
                viewKind: '9x9',
                variant: 'default',
            },
        } as SceneRootContext);
        expect(nineByNineResolve).toHaveBeenCalledTimes(1);
    });
});
