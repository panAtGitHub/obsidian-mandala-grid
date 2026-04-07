import { MandalaView } from 'src/view/view';
import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import { getSectionCore } from 'src/mandala-display/logic/mandala-topology';
import {
    posOfSection9x9,
    sectionAtCell9x9,
} from 'src/mandala-display/logic/mandala-grid';
import { setActiveCell9x9 } from 'src/mandala-interaction/helpers/set-active-cell-9x9';

const deltas: Record<AllDirections, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

const isCenterCell = (row: number, col: number) =>
    row >= 3 && row <= 5 && col >= 3 && col <= 5;

export const tryMandala9x9Navigation = (
    view: MandalaView,
    direction: AllDirections,
    options?: { extendSelection?: boolean },
) => {
    const startedAt = performance.now();
    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return false;
    if (view.mandalaMode !== '9x9') return false;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = docState.sections.id_section[activeNodeId];

    const selectedLayoutId = view.getCurrentMandalaLayoutId();
    const customLayouts =
        view.plugin.settings.getValue().view.mandalaGridCustomLayouts ?? [];
    const baseTheme = getSectionCore(activeSection) ?? '1';
    const cell = view.mandalaActiveCell9x9;
    const mapped = cell
        ? sectionAtCell9x9(
              cell.row,
              cell.col,
              selectedLayoutId,
              baseTheme,
              customLayouts,
          )
        : null;
    const current =
        mapped === activeSection
            ? cell
            : activeSection
              ? posOfSection9x9(
                    activeSection,
                    selectedLayoutId,
                    baseTheme,
                    customLayouts,
                )
              : null;
    if (!current) return true;

    if (!cell || mapped !== activeSection) {
        setActiveCell9x9(view, { row: current.row, col: current.col });
    }

    const { dr, dc } = deltas[direction];
    let nextRow = current.row + dr;
    let nextCol = current.col + dc;
    while (
        nextRow >= 0 &&
        nextCol >= 0 &&
        nextRow <= 8 &&
        nextCol <= 8 &&
        isCenterCell(nextRow, nextCol)
    ) {
        nextRow += dr;
        nextCol += dc;
    }
    if (nextRow < 0 || nextCol < 0 || nextRow > 8 || nextCol > 8) return true;

    const nextSection = sectionAtCell9x9(
        nextRow,
        nextCol,
        selectedLayoutId,
        baseTheme,
        customLayouts,
    );
    if (!nextSection) return true;

    setActiveCell9x9(view, { row: nextRow, col: nextCol });
    view.recordPerfAfterNextPaint('interaction.9x9.navigate', startedAt, {
        direction,
        from_row: current.row,
        from_col: current.col,
        to_row: nextRow,
        to_col: nextCol,
    });

    const nextNodeId = docState.sections.section_id[nextSection];
    if (!nextNodeId) return true;

    if (nextNodeId === activeNodeId) return true;

    view.viewStore.dispatch({
        type: 'view/set-active-node/9x9-nav',
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
