import { AllDirections } from 'src/mandala-document/state/document-store-actions';
import type { MandalaView } from 'src/view/view';
import {
    resolveNx9Context,
    resolveNx9CurrentCell,
} from 'src/mandala-scenes/view-nx9/context';
import { setActiveCellNx9 } from 'src/mandala-scenes/view-nx9/set-active-cell';

const deltas: Record<AllDirections, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

export const tryMandalaNx9Navigation = (
    view: MandalaView,
    direction: AllDirections,
    options?: { extendSelection?: boolean },
) => {
    const startedAt = performance.now();
    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return false;
    if (view.mandalaMode !== 'nx9') return false;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSection = docState.sections.id_section[activeNodeId] ?? null;
    const context = resolveNx9Context({
        sectionIdMap: docState.sections.section_id,
        documentContent: docState.document.content,
        rowsPerPage: view.getCurrentNx9RowsPerPage(),
        activeSection,
        activeCell: view.mandalaActiveCellNx9,
    });
    const current = resolveNx9CurrentCell({
        activeCell: view.mandalaActiveCellNx9,
        activeSection,
        context,
    });

    if (!view.mandalaActiveCellNx9) {
        setActiveCellNx9(view, current);
    }

    const { dr, dc } = deltas[direction];
    let nextPage = current.page;
    let nextRow = current.row + dr;
    const nextCol = current.col + dc;

    if (nextCol < 0 || nextCol > 8) return true;

    if (nextRow < 0) {
        if (nextPage === 0) return true;
        nextPage -= 1;
        nextRow = context.rowsPerPage - 1;
    } else if (nextRow >= context.rowsPerPage) {
        if (nextPage >= context.totalPages - 1) return true;
        nextPage += 1;
        nextRow = 0;
    }

    if (!context.isSelectableCell(nextRow, nextCol, nextPage)) {
        return true;
    }

    const nextSection = context.sectionForCell(nextRow, nextCol, nextPage);
    setActiveCellNx9(view, { row: nextRow, col: nextCol, page: nextPage });
    view.recordPerfAfterNextPaint('interaction.nx9.navigate', startedAt, {
        direction,
        from_page: current.page,
        to_page: nextPage,
        from_row: current.row,
        to_row: nextRow,
        from_col: current.col,
        to_col: nextCol,
    });
    if (!nextSection) return true;

    const nextNodeId = docState.sections.section_id[nextSection];
    if (!nextNodeId || nextNodeId === activeNodeId) return true;

    view.viewStore.dispatch({
        type: 'view/set-active-node/nx9-nav',
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
