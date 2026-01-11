import { LineageView } from 'src/view/view';
import { AllDirections } from 'src/stores/document/document-store-actions';
import {
    coreGrid,
    positions,
    posOfSection3x3,
    slotPositions,
    themeGrid,
} from 'src/view/helpers/mandala/mandala-grid';

const deltas: Record<AllDirections, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

export const tryMandala3x3Navigation = (
    view: LineageView,
    direction: AllDirections,
    options?: { extendSelection?: boolean },
) => {
    const docState = view.documentStore.getValue();
    if (!docState.meta.isMandala) return false;
    if (view.mandalaMode !== '3x3') return false;

    const activeNodeId = view.viewStore.getValue().document.activeNode;
    const activeSectionRaw = docState.sections.id_section[activeNodeId];
    if (!activeSectionRaw) return false;

    const subgridTheme = view.viewStore.getValue().ui.mandala.subgridTheme;

    const pos = (() => {
        if (subgridTheme) {
            if (activeSectionRaw === subgridTheme) return { row: 1, col: 1 };
            if (activeSectionRaw.startsWith(`${subgridTheme}.`)) {
                const slot = activeSectionRaw.split('.')[1] ?? '';
                return slotPositions[slot] ?? null;
            }
            return null;
        }

        const activeSection = activeSectionRaw.includes('.')
            ? activeSectionRaw.split('.')[0]
            : activeSectionRaw;

        return positions[activeSection] ?? posOfSection3x3(activeSection);
    })();
    if (!pos) return false;

    const { dr, dc } = deltas[direction];
    const nextRow = pos.row + dr;
    const nextCol = pos.col + dc;

    const nextSection = (() => {
        if (subgridTheme) {
            if (nextRow === 1 && nextCol === 1) return subgridTheme;
            const slot = themeGrid[nextRow]?.[nextCol] ?? null;
            return slot ? `${subgridTheme}.${slot}` : null;
        }
        return coreGrid[nextRow]?.[nextCol] ?? null;
    })();

    if (!nextSection) return true;

    const nextNodeId = docState.sections.section_id[nextSection];
    if (!nextNodeId) return true;

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

    view.viewStore.dispatch({
        type: 'view/set-active-node/mouse-silent',
        payload: { id: nextNodeId },
    });
    return true;
};
