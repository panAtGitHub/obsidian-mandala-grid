import { MandalaView } from 'src/view/view';
import { AllDirections } from 'src/stores/document/document-store-actions';
import { setActiveCellWeek7x9 } from 'src/helpers/views/mandala/set-active-cell-week-7x9';
import {
    resolveWeekPlanContext,
    resolveWeekPlanCurrentCell,
} from 'src/view/helpers/mandala/week-plan-context';

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
    if (view.mandalaMode !== 'week-7x9') return false;

    const documentState = view.documentStore.getValue();
    const weekContext = resolveWeekPlanContext({
        frontmatter: documentState.file.frontmatter,
        anchorDate: view.viewStore.getValue().ui.mandala.weekAnchorDate,
        weekStart: view.plugin.settings.getValue().general.weekStart,
    });
    if (!weekContext.dayPlan) return false;

    const rows = weekContext.rows;
    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = documentState.sections.id_section[activeNodeId];
    const current = resolveWeekPlanCurrentCell({
        activeCell: view.mandalaActiveCellWeek7x9,
        activeSection,
        rows,
    });

    if (!view.mandalaActiveCellWeek7x9) {
        setActiveCellWeek7x9(view, current);
    }

    const { dr, dc } = deltas[direction];
    const nextRow = current.row + dr;
    const nextCol = current.col + dc;
    if (nextRow < 0 || nextCol < 0 || nextRow > 6 || nextCol > 8) return true;

    const nextSection = weekContext.sectionForCell(nextRow, nextCol);
    setActiveCellWeek7x9(view, { row: nextRow, col: nextCol });
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
