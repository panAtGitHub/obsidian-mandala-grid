import { beforeEach, describe, expect, it, vi } from 'vitest';

import { navigateSharedViewUnit } from 'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/navigate-shared-view-unit';

const { jumpCoreTheme } = vi.hoisted(() => ({
    jumpCoreTheme: vi.fn(),
}));

vi.mock(
    'src/view/actions/keyboard-shortcuts/helpers/commands/commands/helpers/jump-core-theme',
    () => ({
        jumpCoreTheme,
    }),
);

type ViewStub = {
    getMandalaSceneKey: () => {
        viewKind: '3x3' | '9x9' | 'nx9';
        variant: 'default' | 'day-plan' | 'week-7x9';
    };
    focusNx9Page: ReturnType<typeof vi.fn>;
    mandalaWeekAnchorDate: string | null;
    viewStore: {
        dispatch: ReturnType<typeof vi.fn>;
    };
};

describe('navigateSharedViewUnit', () => {
    beforeEach(() => {
        jumpCoreTheme.mockReset();
    });

    const createView = (
        sceneKey: ReturnType<ViewStub['getMandalaSceneKey']>,
        weekAnchorDate = '2026-04-24',
    ) =>
        ({
            getMandalaSceneKey: () => sceneKey,
            focusNx9Page: vi.fn(),
            mandalaWeekAnchorDate: weekAnchorDate,
            viewStore: {
                dispatch: vi.fn(),
            },
        }) satisfies ViewStub;

    it('routes 9x9 navigation to core jumps', () => {
        const view = createView({
            viewKind: '9x9',
            variant: 'default',
        });

        navigateSharedViewUnit(view as never, 'prev');
        navigateSharedViewUnit(view as never, 'next');

        expect(jumpCoreTheme).toHaveBeenNthCalledWith(1, view, 'up');
        expect(jumpCoreTheme).toHaveBeenNthCalledWith(2, view, 'down');
        expect(view.focusNx9Page).not.toHaveBeenCalled();
        expect(view.viewStore.dispatch).not.toHaveBeenCalled();
    });

    it('routes default nx9 navigation to page changes', () => {
        const view = createView({
            viewKind: 'nx9',
            variant: 'default',
        });

        navigateSharedViewUnit(view as never, 'next');

        expect(view.focusNx9Page).toHaveBeenCalledWith('next');
        expect(jumpCoreTheme).not.toHaveBeenCalled();
        expect(view.viewStore.dispatch).not.toHaveBeenCalled();
    });

    it('routes week 7x9 navigation to week anchor updates', () => {
        const view = createView({
            viewKind: 'nx9',
            variant: 'week-7x9',
        });

        navigateSharedViewUnit(view as never, 'prev');

        expect(view.viewStore.dispatch).toHaveBeenNthCalledWith(1, {
            type: 'view/mandala/week-anchor-date/set',
            payload: { date: '2026-04-17' },
        });
        expect(view.viewStore.dispatch).toHaveBeenNthCalledWith(2, {
            type: 'view/mandala/week-active-cell/set',
            payload: { cell: null },
        });
        expect(view.focusNx9Page).not.toHaveBeenCalled();
        expect(jumpCoreTheme).not.toHaveBeenCalled();
    });
});
