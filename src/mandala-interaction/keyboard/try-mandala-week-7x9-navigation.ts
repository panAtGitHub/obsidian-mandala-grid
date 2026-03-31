import { MandalaView } from 'src/view/view';
import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import {
    resolveWeekPlanContext,
    resolveWeekPlanCurrentCell,
} from 'src/mandala-display/logic/week-plan-context';
import { setActiveCellNx9Week7x9 } from 'src/mandala-scenes/view-nx9-week-7x9/set-active-cell';

const deltas: Record<AllDirections, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

export const tryMandalaWeek7x9Navigation = (
    view: MandalaView,
    direction: AllDirections,
    options?: { extendSelection?: boolean },
) => {
    if (view.mandalaMode !== 'nx9' || !view.isWeekPlanVariant()) return false;

    const documentState = view.documentStore.getValue();
    const weekContext = resolveWeekPlanContext({
        frontmatter: documentState.file.frontmatter,
        anchorDate: view.mandalaWeekAnchorDate,
        weekStart: view.getEffectiveMandalaSettings().general.weekStart,
    });
    if (!weekContext.dayPlan) return false;

    const rows = weekContext.rows;
    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = documentState.sections.id_section[activeNodeId];
    const current = resolveWeekPlanCurrentCell({
        activeCell:
            view.mandalaActiveCellNx9?.page === 0
                ? {
                      row: view.mandalaActiveCellNx9.row,
                      col: view.mandalaActiveCellNx9.col,
                  }
                : null,
        activeSection,
        rows,
    });

    if (!view.mandalaActiveCellNx9 || view.mandalaActiveCellNx9.page !== 0) {
        setActiveCellNx9Week7x9(view, {
            row: current.row,
            col: current.col,
            page: 0,
        });
    }

    const { dr, dc } = deltas[direction];
    const nextRow = current.row + dr;
    const nextCol = current.col + dc;
    if (nextRow < 0 || nextCol < 0 || nextRow > 6 || nextCol > 8) return true;

    const nextSection = weekContext.sectionForCell(nextRow, nextCol);
    setActiveCellNx9Week7x9(view, {
        row: nextRow,
        col: nextCol,
        page: 0,
    });
    if (!nextSection) return true;

    const nextNodeId = documentState.sections.section_id[nextSection];
    if (!nextNodeId) return true;
    if (nextNodeId === activeNodeId) return true;

    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: nextNodeId },
    });

    if (options?.extendSelection) {
        const selected = new Set(
            view.viewStore.getValue().document.selectedNodes,
        );
        selected.add(activeNodeId);
        selected.add(nextNodeId);
        view.viewStore.dispatch({
            type: 'view/selection/set-selection',
            payload: { ids: Array.from(selected) },
        });
    }

    return true;
};
