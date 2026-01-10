import { LineageView } from 'src/view/view';
import { AllDirections } from 'src/stores/document/document-store-actions';
import {
    posOfSection9x9,
    sectionAtCell9x9,
} from 'src/view/helpers/mandala/mandala-grid';

const deltas: Record<AllDirections, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

export const tryMandala9x9Navigation = (
    view: LineageView,
    direction: AllDirections,
    options?: { extendSelection?: boolean },
) => {
    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return false;
    if (view.mandalaMode !== '9x9') return false;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = docState.sections.id_section[activeNodeId];
    if (!activeSection) return false;

    const cell = view.mandalaActiveCell9x9;
    const mapped = cell ? sectionAtCell9x9(cell.row, cell.col) : null;
    const current =
        mapped === activeSection
            ? cell
            : posOfSection9x9(activeSection);
    if (!current) return true;

    if (!cell || mapped !== activeSection) {
        view.mandalaActiveCell9x9 = { row: current.row, col: current.col };
    }

    const { dr, dc } = deltas[direction];
    const nextRow = current.row + dr;
    const nextCol = current.col + dc;
    if (nextRow < 0 || nextCol < 0 || nextRow > 8 || nextCol > 8) {
        return true;
    }

    const nextSection = sectionAtCell9x9(nextRow, nextCol);
    if (!nextSection) return true;

    const nextNodeId = docState.sections.section_id[nextSection];
    if (!nextNodeId) return true;

    view.mandalaActiveCell9x9 = { row: nextRow, col: nextCol };

    if (nextNodeId === activeNodeId) return true;

    if (options?.extendSelection) {
        const selected = new Set(view.viewStore.getValue().document.selectedNodes);
        selected.add(activeNodeId);
        selected.add(nextNodeId);
        view.viewStore.dispatch({
            type: 'view/selection/set-selection',
            payload: { ids: Array.from(selected) },
        });
    }

    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: nextNodeId },
    });
    return true;
};
