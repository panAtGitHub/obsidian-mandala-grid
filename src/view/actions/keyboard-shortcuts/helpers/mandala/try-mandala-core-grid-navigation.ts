import { LineageView } from 'src/view/view';
import { AllDirections } from 'src/stores/document/document-store-actions';

const coreGrid = [
    ['2', '3', '4'],
    ['5', '1', '6'],
    ['7', '8', '9'],
] as const;

const positions: Record<string, { row: number; col: number } | undefined> = {
    '1': { row: 1, col: 1 },
    '2': { row: 0, col: 0 },
    '3': { row: 0, col: 1 },
    '4': { row: 0, col: 2 },
    '5': { row: 1, col: 0 },
    '6': { row: 1, col: 2 },
    '7': { row: 2, col: 0 },
    '8': { row: 2, col: 1 },
    '9': { row: 2, col: 2 },
};

const deltas: Record<AllDirections, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

export const tryMandalaCoreGridNavigation = (
    view: LineageView,
    direction: AllDirections,
    options?: { extendSelection?: boolean },
) => {
    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return false;
    if (view.mandalaMode !== '3x3') return false;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = docState.sections.id_section[activeNodeId];
    if (!activeSection) return false;
    if (activeSection.includes('.')) return false;

    const pos = positions[activeSection];
    if (!pos) return false;

    const { dr, dc } = deltas[direction];
    const nextRow = pos.row + dr;
    const nextCol = pos.col + dc;
    const nextSection = coreGrid[nextRow]?.[nextCol];
    if (!nextSection) return true;

    const nextNodeId = docState.sections.section_id[nextSection];
    if (!nextNodeId) return true;
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

