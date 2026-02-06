import { MandalaView } from 'src/view/view';
import { AllDirections } from 'src/stores/document/document-store-actions';
import {
    posOfSection9x9,
    sectionAtCell9x9,
} from 'src/view/helpers/mandala/mandala-grid';
import { setActiveCell9x9 } from 'src/view/helpers/mandala/set-active-cell-9x9';

const deltas: Record<AllDirections, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

export const tryMandala9x9Navigation = (
    view: MandalaView,
    direction: AllDirections,
    options?: { extendSelection?: boolean },
) => {
    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return false;
    if (view.mandalaMode !== '9x9') return false;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = docState.sections.id_section[activeNodeId];

    const gridOrientation =
        view.plugin.settings.getValue().view.mandalaGridOrientation ??
        'left-to-right';
    const baseTheme = activeSection ? activeSection.split('.')[0] : '1';
    const cell = view.mandalaActiveCell9x9;
    const current =
        cell ??
        (activeSection
            ? posOfSection9x9(activeSection, gridOrientation, baseTheme)
            : null);
    if (!current) return true;

    if (!cell) {
        setActiveCell9x9(view, { row: current.row, col: current.col });
    }

    const { dr, dc } = deltas[direction];
    const nextRow = current.row + dr;
    const nextCol = current.col + dc;
    if (nextRow < 0 || nextCol < 0 || nextRow > 8 || nextCol > 8) return true;

    const nextSection = sectionAtCell9x9(
        nextRow,
        nextCol,
        gridOrientation,
        baseTheme,
    );
    if (!nextSection) return true;

    setActiveCell9x9(view, { row: nextRow, col: nextCol });

    const nextNodeId = docState.sections.section_id[nextSection];
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
