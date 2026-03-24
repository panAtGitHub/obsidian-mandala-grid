import type {
    MandalaSceneKey,
    MandalaSceneVariant,
} from 'src/mandala-display/logic/mandala-profile';
import type { Nx9ActiveCell } from 'src/mandala-scenes/view-nx9/context';
import type { ViewState } from 'src/stores/view/view-state-type';

export type ActiveCell9x9 = { row: number; col: number } | null;
export type ActiveCellWeek7x9 = { row: number; col: number } | null;

const getMandalaSceneState = (viewState: ViewState) =>
    viewState.ui.mandala.sceneState ?? {
        nineByNine: {
            activeCell: null,
        },
        nx9: {
            activeCell: null,
            weekPlan: {
                activeCell: null,
                anchorDate: null,
            },
        },
    };

export const getMandalaWeekPlanState = (viewState: ViewState) =>
    getMandalaSceneState(viewState).nx9.weekPlan;

export const getMandalaActiveCell9x9 = (
    viewState: ViewState,
): ActiveCell9x9 => getMandalaSceneState(viewState).nineByNine.activeCell;

export const getMandalaActiveCellNx9 = (
    viewState: ViewState,
): Nx9ActiveCell | null => getMandalaSceneState(viewState).nx9.activeCell;

export const getMandalaActiveCellWeek7x9 = (
    viewState: ViewState,
): ActiveCellWeek7x9 => getMandalaWeekPlanState(viewState).activeCell;

export const getMandalaWeekAnchorDate = (
    viewState: ViewState,
): string | null => getMandalaWeekPlanState(viewState).anchorDate;

const matchesSceneKey = (
    focusTarget: ViewState['ui']['mandala']['focusTarget'],
    sceneKey: MandalaSceneKey,
) =>
    focusTarget?.kind === 'cell' &&
    focusTarget.viewKind === sceneKey.viewKind &&
    focusTarget.variant === sceneKey.variant;

const toFocusedCell = (
    focusTarget: ViewState['ui']['mandala']['focusTarget'],
): Exclude<ViewState['ui']['mandala']['focusTarget'], null> & { kind: 'cell' } =>
    focusTarget as Exclude<ViewState['ui']['mandala']['focusTarget'], null> & {
        kind: 'cell';
    };

export const resolveSceneActiveCell = (
    viewState: ViewState,
    sceneKey: MandalaSceneKey,
): ActiveCell9x9 | Nx9ActiveCell | ActiveCellWeek7x9 => {
    const focusTarget = viewState.ui.mandala.focusTarget;
    if (matchesSceneKey(focusTarget, sceneKey)) {
        const focusedCell = toFocusedCell(focusTarget);
        return focusedCell.page === undefined
            ? {
                  row: focusedCell.row,
                  col: focusedCell.col,
              }
            : {
                  row: focusedCell.row,
                  col: focusedCell.col,
                  page: focusedCell.page,
              };
    }

    if (sceneKey.viewKind === '9x9') {
        return getMandalaActiveCell9x9(viewState);
    }

    if (sceneKey.viewKind === 'nx9' && sceneKey.variant === 'week-7x9') {
        return getMandalaActiveCellWeek7x9(viewState);
    }

    if (sceneKey.viewKind === 'nx9') {
        return getMandalaActiveCellNx9(viewState);
    }

    return null;
};

export const isWeekSceneVariant = (variant: MandalaSceneVariant) =>
    variant === 'week-7x9';
