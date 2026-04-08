import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    focusThreeByThreeDayPlanTodayFromButton,
    resolveThreeByThreeDayPlanTodayTargetSection,
    syncThreeByThreeDayPlanSceneState,
} from 'src/mandala-scenes/view-3x3-day-plan/scene-state';

const mocks = vi.hoisted(() => ({
    syncThreeByThreeSubgridState: vi.fn(),
}));

vi.mock('src/mandala-scenes/view-3x3/scene-state', () => ({
    syncThreeByThreeSubgridState: mocks.syncThreeByThreeSubgridState,
}));

describe('view-3x3-day-plan/scene-state', () => {
    beforeEach(() => {
        mocks.syncThreeByThreeSubgridState.mockReset();
    });

    it('syncs the shared 3x3 subgrid state with expansion enabled and returns today target section', () => {
        const view = {};
        const documentState = {
            meta: { isMandala: true },
            document: {
                columns: [],
            },
        } as never;
        const sectionToNodeId = {
            '1.6': 'node-1-6',
        };
        const dayPlanTodayNavigation = {
            isDayPlan: true,
            targetSection: '1.6',
            canNavigate: true,
        };

        const targetSection = syncThreeByThreeDayPlanSceneState({
            view: view as never,
            mode: '3x3',
            subgridTheme: '1.6',
            documentState,
            sectionToNodeId,
            dayPlan: {
                enabled: true,
                year: 2026,
            } as never,
            dayPlanTodayNavigation,
        });

        expect(targetSection).toBe('1.6');
        expect(mocks.syncThreeByThreeSubgridState).toHaveBeenCalledWith({
            view,
            mode: '3x3',
            subgridTheme: '1.6',
            documentState,
            sectionToNodeId,
            allowSubgridExpansion: true,
        });
    });

    it('delegates the today target section lookup to navigation state', () => {
        expect(
            resolveThreeByThreeDayPlanTodayTargetSection({
                isDayPlan: true,
                targetSection: '1.3',
                canNavigate: true,
            }),
        ).toBe('1.3');
    });

    it('stops propagation and focuses the day-plan today target', () => {
        const stopPropagation = vi.fn();
        const focusDayPlanToday = vi.fn();

        focusThreeByThreeDayPlanTodayFromButton(
            {
                focusDayPlanToday,
            } as never,
            {
                stopPropagation,
            } as unknown as MouseEvent,
        );

        expect(stopPropagation).toHaveBeenCalledTimes(1);
        expect(focusDayPlanToday).toHaveBeenCalledTimes(1);
    });
});
